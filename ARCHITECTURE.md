# Architecture Evolution Document

## Overview

This document explains how the Collaborative Knowledge Board API evolved from Stage 1 (a foundational REST API) to Stage 2 (a collaborative, production-ready system). It covers the architectural decisions made, the reasoning behind each, and the tradeoffs considered.

---

## Stage 1 → Stage 2 Evolution Summary

| Concern | Stage 1 | Stage 2 |
|---|---|---|
| Real-time | None | Socket.io WebSocket events |
| Comments | Basic CRUD | Threaded replies (2 levels) |
| Card ordering | No position field | Explicit position with safe reordering |
| Concurrent updates | No protection | Optimistic locking via version field |
| Pagination | None | Page/limit on boards and cards |
| Logging | console.log | Winston structured logging |
| Testing | None | 27 Jest tests (unit + integration) |
| Server structure | app.ts starts server | server.ts separated from app.ts |

---

## Real-Time Approach

### Decision
Socket.io was chosen over a raw `ws` implementation because it provides room-based broadcasting, automatic reconnection, and cross-browser compatibility out of the box.

### Architecture
WebSocket logic lives entirely in `src/lib/socket.ts` and is completely decoupled from HTTP route logic. Services emit events after successful operations — the HTTP response and the WebSocket event are independent concerns.
```
HTTP Request → Controller → Service → Repository → Database
                                  ↓
                          Socket.io emit → Connected clients in board room
```

### Room Strategy
Clients join a board-specific room on connection:
```javascript
socket.emit("join_board", boardId)
```
Events are broadcast only to clients in that room. This means a user working on Board A never receives events from Board B, preventing data leakage across workspaces.

### Events
| Event | Emitted when | Payload |
|---|---|---|
| `card_created` | Card is created | `{ card, columnId, boardId }` |
| `card_moved` | Card moves to another column | `{ card, fromColumnId, toColumnId, boardId }` |
| `comment_added` | Comment is added to a card | `{ comment, cardId, boardId }` |

### Tradeoffs
Socket.io adds ~40KB to the bundle and requires sticky sessions in a multi-instance deployment. For this single-instance deployment on Fly.io this is not a concern. If the system were to scale horizontally, a Redis adapter would be needed to broadcast events across instances.

---

## Conflict Handling

### Problem
In a collaborative environment, two users can fetch the same card and both attempt to update it. Without conflict detection, the second write silently overwrites the first — data loss with no indication to either user.

### Decision: Optimistic Locking via Version Field
A `version` integer was added to the Card model. Every update increments the version. The client must send the version they last saw with every update request.

### Flow
```
User A fetches card → version: 0
User B fetches card → version: 0

User A updates card → sends version: 0 → matches DB → success → DB version becomes 1
User B updates card → sends version: 0 → does not match DB (version is now 1) → 409 Conflict
```

### 409 Response
```json
{
  "success": false,
  "message": "Conflict: card was updated by someone else. Fetch the latest version and try again."
}
```

### Why Optimistic Over Pessimistic Locking
Pessimistic locking (locking a row while a user is editing) requires session management and causes bottlenecks under concurrent load. Optimistic locking is stateless — no locks are held between requests. It is the standard approach for REST APIs and scales horizontally without coordination.

### Tradeoffs
The client must handle 409 responses by re-fetching the card and presenting the conflict to the user. This adds frontend complexity but keeps the backend stateless and scalable.

---

## Ordering Strategy

### Problem
Cards within a column need a deterministic, maintainable order. Without an explicit position field, the only ordering available is insertion time, which cannot be changed after creation.

### Decision: Explicit Integer Position
Each card holds a `position` integer within its column. Positions are zero-indexed and contiguous. New cards are appended to the end using `getMaxPosition + 1`.

### Reorder Algorithm
When card at position A moves to position B:

**Moving up (B < A):**
```
Cards at positions B through A-1 → shift down by 1
Card A → set to position B
```

**Moving down (B > A):**
```
Cards at positions A+1 through B → shift up by 1
Card A → set to position B
```

### Cross-Column Move Algorithm
1. Shift cards above the card's old position in the source column up by 1 (fill the gap)
2. Determine target position in destination column (specified or end of column)
3. Shift cards at and below target position in destination column down by 1 (make room)
4. Set card's columnId and position to new values

### Atomicity
All position shifts and the final card update happen inside `prisma.$transaction` with a 15 second timeout. This guarantees atomicity — either all position updates succeed together or none do, preventing duplicate positions or gaps.

### Tradeoffs
This approach requires updating multiple rows on every reorder. For columns with many cards this could be expensive. An alternative is fractional indexing (storing positions as floats like 1.5 between 1 and 2), which requires only a single row update but requires periodic renormalisation to prevent precision exhaustion. Integer shifting was chosen for clarity and correctness at this scale.

---

## Threaded Comments

### Decision
Comments support two levels of nesting via a self-referential `parentId` foreign key on the Comment model. The maximum depth of two levels is enforced in the service layer.

### Schema
```prisma
model Comment {
  parentId  String?
  parent    Comment?  @relation("CommentReplies", fields: [parentId], references: [id])
  replies   Comment[] @relation("CommentReplies")
}
```

### Depth Enforcement
```typescript
if (parentComment.parentId !== null) {
  throw new AppError("Cannot reply to a reply — maximum 2 levels allowed", 400)
}
```

### GET Comments Response Shape
Top-level comments are fetched with `parentId: null` filter. Replies are nested inside each comment via Prisma's `include`. The response returns a tree structure ready for frontend rendering without any additional processing.

### Tradeoffs
Two-level nesting covers most collaborative use cases (comment + response) without the complexity of arbitrary-depth threading. Arbitrary depth would require recursive queries or a closure table pattern, which adds significant complexity for marginal benefit at this scale.

---

## Pagination

### Decision
Boards and cards endpoints support cursor-free offset pagination via `page` and `limit` query parameters. Responses include metadata: `total`, `page`, `limit`, `totalPages`.

### Implementation
```typescript
const skip = (page - 1) * limit
const [data, total] = await Promise.all([
  prisma.model.findMany({ skip, take: limit }),
  prisma.model.count({ where }),
])
```

`Promise.all` is used to run the data query and count query in parallel, avoiding sequential round trips.

### Tradeoffs
Offset pagination can return inconsistent results if records are inserted or deleted between pages (the classic "page drift" problem). Cursor-based pagination avoids this but requires a stable sort key and more complex query logic. Offset pagination was chosen for simplicity given the expected data volumes.

---

## Logging Strategy

### Decision
Winston replaces all `console.log` calls with structured, levelled logging.

### Log Levels
| Level | Used for |
|---|---|
| `info` | All HTTP requests (method, path, status, duration, IP) |
| `warn` | Handled application errors (AppError with known status codes) |
| `error` | Unexpected errors with full stack traces |
| `debug` | Verbose development output (disabled in production) |

### Format
Development: colourised human-readable output for easy terminal scanning.
Production: JSON format for compatibility with log aggregation tools (Datadog, Papertrail, etc.).

### Request Logging
A dedicated `request-logger.middleware.ts` captures every HTTP request using the response `finish` event, logging the total duration after the response is sent.

---

## Testing Strategy

### Structure
Tests are separated into two categories matching their scope and dependencies.

**Unit tests** (`src/__tests__/unit/`) mock all repositories using `jest.mock`. They test service layer business logic in complete isolation — no database, no network. Fast and deterministic.

**Integration tests** (`src/__tests__/integration/`) use Supertest to make real HTTP requests against the Express app connected to the real Neon database. They verify the full request-response cycle including middleware, validation, database operations, and response formatting.

### Key Design Decisions
- `app.ts` exports the Express app without starting a server. `server.ts` handles the listen call. This allows integration tests to import `app` without port conflicts across parallel test files.
- Each integration test suite creates its own isolated test data in `beforeAll` and deletes it in `afterAll`. Tests do not depend on pre-existing data.
- Socket.io is mocked in unit tests to prevent real event emission during isolated service tests.
- All integration tests and `beforeAll`/`afterAll` hooks use a 30 second timeout to account for Neon database cold starts over the network.

### Results
```
Test Suites: 6 passed
Tests:       27 passed
```

---

## Server Structure Change

### Stage 1
`app.ts` contained both the Express app setup and `httpServer.listen`. This caused `EADDRINUSE` errors when multiple test files imported `app` in parallel, since each import triggered a new server start on the same port.

### Stage 2
The listen call was moved to a dedicated `server.ts`:
```typescript
// server.ts
import { httpServer } from "./app"
import { env } from "./config/env"

httpServer.listen(env.port, () => {
  console.log(`Server running on port ${env.port}`)
})
```

`app.ts` exports the Express app and `httpServer` without starting anything. Tests import `app` cleanly. The production entry point is `server.ts`. Development uses `nodemon src/server.ts`.