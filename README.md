# Collaborative Knowledge Board API

A clean, scalable REST API powering a collaborative workspace application — built with Node.js, TypeScript, Express, Prisma, and PostgreSQL. Extended in Stage 2 to support real-time collaboration, threaded comments, card reordering, optimistic update conflict detection, pagination, structured logging, and a full test suite.

---

## Repository

[https://github.com/Ige-Joseph/knowledge-board-api](https://github.com/Ige-Joseph/knowledge-board-api)

---

## Table of Contents

- [Tech Stack](#tech-stack)
- [Database Schema Diagram](#database-schema-diagram)
- [Architecture & Folder Structure](#architecture--folder-structure)
- [Key Engineering Decisions](#key-engineering-decisions)
- [How Relationships Are Handled](#how-relationships-are-handled)
- [Real-Time Events (WebSockets)](#real-time-events-websockets)
- [Conflict Detection Strategy](#conflict-detection-strategy)
- [Card Ordering Strategy](#card-ordering-strategy)
- [Logging Strategy](#logging-strategy)
- [Testing](#testing)
- [Performance Notes](#performance-notes)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [API Documentation](#api-documentation)
- [Deployment](#deployment)

---

## Tech Stack

| Layer | Technology |
|---|---|
| Runtime | Node.js |
| Language | TypeScript (strict mode) |
| Framework | Express |
| ORM | Prisma v5 |
| Database | PostgreSQL (Neon) |
| Auth | JWT + bcryptjs |
| Validation | Zod |
| Real-Time | Socket.io |
| Logging | Winston |
| Testing | Jest + Supertest |
| Docs | Swagger / OpenAPI 3.0 |
| Deployment | Fly.io |
| CI/CD | GitHub Actions |

---

## Database Schema Diagram

```
┌──────────────────────────────────────────────────────────────────────────────────┐
│                                                                                  │
│   ┌──────────────┐         ┌──────────────┐         ┌───────────────┐           │
│   │     User     │         │    Board     │         │    Column     │           │
│   │──────────────│         │──────────────│         │───────────────│           │
│   │ id (PK)      │◄────────│ id (PK)      │◄────────│ id (PK)       │           │
│   │ name         │  1    * │ name         │  1    * │ name          │           │
│   │ email        │         │ userId (FK)  │         │ position      │           │
│   │ password     │         │ createdAt    │         │ boardId (FK)  │           │
│   │ createdAt    │         │ updatedAt    │         │ createdAt     │           │
│   │ updatedAt    │         └──────────────┘         │ updatedAt     │           │
│   └──────┬───────┘                                  └───────┬───────┘           │
│          │                                                  │                   │
│          │ 1                                             1  │                   │
│          │                                                  │                   │
│          │ *                                             *  ▼                   │
│   ┌──────▼───────┐         ┌──────────────┐         ┌───────────────┐           │
│   │   Comment    │         │   CardTag    │         │     Card      │           │
│   │──────────────│         │──────────────│         │───────────────│           │
│   │ id (PK)      │         │ tagId (FK)   │◄────────│ id (PK)       │           │
│   │ content      │         │ cardId (FK)  │         │ title         │           │
│   │ cardId (FK)  │────────►│              │         │ description   │           │
│   │ userId (FK)  │         └──────────────┘         │ dueDate       │           │
│   │ parentId(FK) │           Junction Table          │ columnId (FK) │           │
│   │ createdAt    │                                   │ position      │           │
│   │ updatedAt    │                                   │ version       │           │
│   └──────────────┘                                   │ createdAt     │           │
│                                                      │ updatedAt     │           │
│   ┌──────────────┐                                   └───────────────┘           │
│   │     Tag      │                                                               │
│   │──────────────│                                                               │
│   │ id (PK)      │◄────────CardTag.tagId                                         │
│   │ name (UNIQUE)│                                                               │
│   └──────────────┘                                                               │
│                                                                                  │
└──────────────────────────────────────────────────────────────────────────────────┘

Relationships:
  User     1 ──── *  Board      (a user owns many boards)
  Board    1 ──── *  Column     (a board has many columns)
  Column   1 ──── *  Card       (a column has many cards)
  Card     * ──── *  Tag        (via CardTag junction table)
  Card     1 ──── *  Comment    (a card has many comments)
  User     1 ──── *  Comment    (a user writes many comments)
  Comment  1 ──── *  Comment    (a comment can have replies via parentId)
```

### Entity Descriptions

| Entity | Description |
|---|---|
| User | Authenticated account that owns boards |
| Board | Top-level workspace container owned by a user |
| Column | Ordered stage within a board (e.g. "To Do", "In Progress") |
| Card | Task or item within a column, supports due dates, position, and version |
| Tag | Free-floating label attachable to many cards |
| CardTag | Junction table resolving the Card ↔ Tag many-to-many relationship |
| Comment | Text comment on a card, supports threaded replies via parentId |

---

## Architecture & Folder Structure

This project follows a **strict layered architecture** — each layer has a single responsibility and never crosses into another layer's concerns.

```
src/
├── config/
│   ├── env.ts               # Centralised environment variable access
│   └── swagger.ts           # OpenAPI/Swagger specification
├── lib/
│   ├── prisma.ts            # Prisma client singleton
│   ├── logger.ts            # Winston logger instance
│   └── socket.ts            # Socket.io initialisation and event helpers
├── middlewares/
│   ├── auth.middleware.ts        # JWT verification, attaches req.user
│   ├── error.middleware.ts       # Global error handler with Winston logging
│   ├── request-logger.middleware.ts # Logs every HTTP request
│   └── validate.middleware.ts    # Zod schema validation
├── modules/
│   ├── auth/                # Register & login
│   ├── board/               # Board CRUD with pagination
│   ├── column/              # Column CRUD
│   ├── card/                # Card CRUD, reorder, move, tags, conflict detection
│   ├── tag/                 # Tag creation & listing
│   └── comment/             # Comments with threaded replies
│       ├── *.routes.ts      # URL definitions only
│       ├── *.controller.ts  # Receives request, calls service, returns response
│       ├── *.service.ts     # All business logic lives here
│       ├── *.repository.ts  # Database queries only (Prisma calls)
│       └── *.validator.ts   # Zod input schemas
├── __tests__/
│   ├── unit/                # Unit tests for service layer (mocked repositories)
│   └── integration/         # Integration tests hitting the real database
├── types/
│   └── index.ts             # Shared TypeScript interfaces
├── utils/
│   ├── AppError.ts          # Custom error class with statusCode
│   └── response.ts          # Consistent JSON response helpers
├── app.ts                   # Express app setup, routes, Socket.io init
└── server.ts                # HTTP server startup (separate from app for testing)
```

### Why This Structure?

**Module-based organisation** groups all files for a feature together rather than grouping by file type. This means when working on cards, everything you need — routes, controller, service, repository, validator — is in one folder.

**`server.ts` separated from `app.ts`** — the HTTP server startup is isolated from the Express app definition. This allows integration tests to import `app` without starting a server on a port, preventing `EADDRINUSE` conflicts during testing.

**Layer separation** enforces a strict contract:

| Layer | Responsibility | What it must NOT do |
|---|---|---|
| Route | Map URL to controller | No logic |
| Controller | Receive request, return response | No DB calls, no business logic |
| Service | Business logic, ownership checks, emit WebSocket events | No direct DB calls |
| Repository | Prisma queries only | No business logic |

---

## Key Engineering Decisions

### 1. Prisma v5 over v7
Prisma v7 introduced breaking changes requiring driver adapters for custom output paths. Prisma v5 uses the stable `@prisma/client` path. Choosing stability over bleeding-edge avoids unnecessary complexity.

### 2. UUID primary keys over auto-increment integers
Prevents sequential ID enumeration attacks, is safe for distributed systems, and avoids exposing record counts to clients.

### 3. Cascade deletes through the hierarchy
All foreign key relationships use `onDelete: Cascade`. Deleting a User automatically wipes their Boards → Columns → Cards → Comments and CardTags. No orphaned data can accumulate.

### 4. Ownership checks in the service layer
Every mutating operation verifies the authenticated user owns the resource before proceeding. Centralised in services so it applies regardless of where the service is called from.

### 5. Comment authorship checks
Only the author of a comment can edit or delete it. This is separate from board ownership and enforced independently in the comment service.

### 6. Consistent response envelope
Every response follows the same structure:
```json
{ "success": true, "data": { ... } }
{ "success": false, "message": "..." }
```

### 7. Zod validation before controllers
Input validated at middleware level before reaching the controller. Invalid requests rejected early with field-level errors.

### 8. Position field on cards and columns
Explicit `position` integer fields support ordered rendering on the frontend. Cards auto-assign position on creation using `getMaxPosition + 1`.

### 9. server.ts / app.ts separation
Separating the HTTP listen call from the Express app definition allows test suites to import the app without binding to a port, preventing address conflicts across parallel test files.

---

## How Relationships Are Handled

### One-to-Many (Hierarchical)
```
User → Board → Column → Card → Comment
```
Each child holds a foreign key to its parent with cascade delete.

### Many-to-Many (Tags)
A `CardTag` junction table with composite primary key `[cardId, tagId]` prevents duplicate assignments. Tag assignment uses a replace strategy — existing assignments cleared, new set inserted — making it idempotent.

### Threaded Comments (Self-Referential)
Comments have an optional `parentId` pointing back to another Comment. This enables two-level threading — a top-level comment can have replies, but replies cannot be replied to. Enforced in the service layer:

```typescript
if (parentComment.parentId !== null) {
  throw new AppError("Cannot reply to a reply — maximum 2 levels allowed", 400)
}
```

The GET comments endpoint returns top-level comments only (`parentId: null`) with replies nested inside each comment's `replies` array.

---

## Real-Time Events (WebSockets)

Socket.io is used for real-time updates. WebSocket logic lives entirely in `src/lib/socket.ts`, completely separate from HTTP route logic.

### Connecting

```javascript
const socket = io("https://knowledge-board-api.fly.dev")

socket.on("connect", () => {
  // join a board room to receive updates for that board
  socket.emit("join_board", "your-board-id")
})
```

### Events Emitted by the Server

| Event | Trigger | Payload |
|---|---|---|
| `card_created` | A card is created in any column | `{ card, columnId, boardId }` |
| `card_moved` | A card is moved to a different column | `{ card, fromColumnId, toColumnId, boardId }` |
| `comment_added` | A comment is added to any card | `{ comment, cardId, boardId }` |

### Room Strategy
Clients join a board-specific room using `socket.emit("join_board", boardId)`. Events are only broadcast to clients in the relevant board's room — not to all connected clients. This prevents data leaking across boards.

---

## Conflict Detection Strategy

Cards have a `version` integer field that increments on every update. This implements optimistic locking for frontend update support.

**How it works:**
1. Client fetches a card — receives the current `version` (e.g. `0`)
2. Client sends an update with the version they last saw: `{ title: "...", version: 0 }`
3. Server checks: if `card.version !== data.version` → 409 Conflict
4. If versions match → update succeeds and `version` increments to `1`

**409 Response:**
```json
{
  "success": false,
  "message": "Conflict: card was updated by someone else. Fetch the latest version and try again."
}
```

The client should re-fetch the card, show the latest state, and let the user reapply their changes. This prevents silent data loss in collaborative environments.

---

## Card Ordering Strategy

Cards maintain an explicit `position` integer within their column. Positions are zero-indexed and contiguous.

### Reordering within a column
When a card moves from position A to position B:
- Moving up (B < A): cards between B and A-1 shift down by 1
- Moving down (B > A): cards between A+1 and B shift up by 1
- The moved card is then placed at position B

All position updates happen inside a Prisma transaction to prevent partial updates or duplicate positions.

### Moving across columns
1. Cards above the moved card's old position in the source column shift up to fill the gap
2. Cards at and below the target position in the destination column shift down to make room
3. The card is placed at the target position in the new column

If no target position is specified, the card is appended to the end of the destination column.

### Preventing duplicate positions
All reorder and move operations are wrapped in `prisma.$transaction` with a 15 second timeout. This ensures atomicity — either all position updates succeed or none do.

---

## Logging Strategy

Winston is used for structured logging. All logs are JSON-formatted in production and human-readable (colourised) in development.

**Log levels:**
- `info` — all HTTP requests (method, path, status code, duration, IP)
- `warn` — handled application errors (AppError instances with status codes)
- `error` — unexpected errors (unhandled exceptions with full stack traces)
- `debug` — verbose output in development only

**Request logging** is handled by a dedicated `request-logger.middleware.ts` that fires on every response using the `finish` event, logging the duration of each request.

**Socket.io events** (connect, join, leave, disconnect) are also logged at `info` level.

---

## Testing

The test suite uses Jest with ts-jest and Supertest.

```bash
npm test              # run all tests
npm run test:coverage # run with coverage report
```

### Unit Tests (service layer)
Repositories are mocked with `jest.mock`. Tests verify business logic in isolation without hitting the database.

- `board.service.test.ts` — createBoard, getUserBoards, ownership checks
- `card.service.test.ts` — createCard, conflict detection (version mismatch → 409)
- `comment.service.test.ts` — createComment, createReply, 2-level depth enforcement

### Integration Tests (full HTTP flow)
Tests hit the real Neon database using Supertest. Each suite creates its own test data in `beforeAll` and cleans up in `afterAll`.

- `board.integration.test.ts` — create board flow, pagination, auth checks
- `card.integration.test.ts` — create card, move card across columns, conflict detection
- `comment.integration.test.ts` — add comment, nested replies, reply depth limit

**Current test results: 27/27 passing**

---

## Performance Notes

### Pagination
Both boards and cards endpoints support pagination via `page` and `limit` query parameters. Responses include `total`, `page`, `limit`, and `totalPages` metadata alongside the data array. Default: page 1, limit 10.

```
GET /api/boards?page=1&limit=10
GET /api/columns/:columnId/cards?page=1&limit=10
```

### N+1 Prevention
All Prisma queries that return related data use `include` to fetch relations in a single query rather than issuing separate queries per record. For example, fetching cards includes their tags in the same query:

```typescript
prisma.card.findMany({
  where: { columnId },
  include: { tags: { include: { tag: true } } },
})
```

Comments are fetched with two levels of replies in a single query using nested `include`.

### Strategic Indexing
The following indexes are defined in the Prisma schema:

| Table | Index | Reason |
|---|---|---|
| User | `email` | Login lookup |
| Board | `userId` | Fetch boards per user |
| Column | `boardId` | Fetch columns per board |
| Card | `columnId` | Fetch cards per column |
| Card | `[columnId, position]` | Ordered card fetching and reorder operations |
| Comment | `cardId` | Fetch comments per card |
| Comment | `parentId` | Fetch replies per comment |

---

## Getting Started

### Prerequisites
- Node.js 18+
- A PostgreSQL database (Neon recommended)

### Installation

```bash
git clone https://github.com/Ige-Joseph/knowledge-board-api
cd knowledge-board-api
npm install
```

### Database Setup

```bash
npx prisma migrate dev
npx prisma generate
```

### Run Development Server

```bash
npm run dev
```

Server starts at `http://localhost:3000`

### Run Tests

```bash
npm test
```

---

## Environment Variables

Create a `.env` file in the root (see `.env.example` for reference):

```env
DATABASE_URL="postgresql://user:password@host/dbname?sslmode=require"
JWT_SECRET="your-secret-key"
JWT_EXPIRES_IN="7d"
PORT=3000
NODE_ENV=development
```

---

## API Documentation

Interactive Swagger docs:

```
http://localhost:3000/api/docs
```

Deployed:

```
https://knowledge-board-api.fly.dev/api/docs
```

All protected endpoints require:

```
Authorization: Bearer <your_jwt_token>
```

### Endpoint Summary

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | /api/auth/register | No | Register new user |
| POST | /api/auth/login | No | Login and get token |
| POST | /api/boards | Yes | Create a board |
| GET | /api/boards | Yes | Get user's boards (paginated) |
| PUT | /api/boards/:id | Yes | Update a board |
| DELETE | /api/boards/:id | Yes | Delete a board |
| POST | /api/boards/:boardId/columns | Yes | Create a column |
| PUT | /api/boards/:boardId/columns/:id | Yes | Update a column |
| DELETE | /api/boards/:boardId/columns/:id | Yes | Delete a column |
| POST | /api/columns/:columnId/cards | Yes | Create a card |
| GET | /api/columns/:columnId/cards | Yes | Get cards in column (paginated) |
| PUT | /api/columns/:columnId/cards/:id | Yes | Update a card (requires version) |
| DELETE | /api/columns/:columnId/cards/:id | Yes | Delete a card |
| PATCH | /api/columns/:columnId/cards/:id/reorder | Yes | Reorder card within column |
| PATCH | /api/columns/:columnId/cards/:id/move | Yes | Move card to another column |
| POST | /api/columns/:columnId/cards/:id/tags | Yes | Assign tags to card |
| POST | /api/tags | Yes | Create a tag |
| GET | /api/tags | Yes | Get all tags |
| POST | /api/cards/:cardId/comments | Yes | Add comment to card |
| GET | /api/cards/:cardId/comments | Yes | Get comments with nested replies |
| PUT | /api/cards/:cardId/comments/:id | Yes | Update a comment |
| DELETE | /api/cards/:cardId/comments/:id | Yes | Delete a comment |
| POST | /api/cards/:cardId/comments/:commentId/replies | Yes | Reply to a comment |

---

## Deployment

The API is deployed at: `https://knowledge-board-api.fly.dev`

Deployments are automated via GitHub Actions. Every push to `main` triggers a build and deploy to Fly.io.

To deploy your own instance:

1. Install the Fly CLI and run `flyctl auth login`
2. Run `flyctl launch` in the project root
3. Set environment variables:
```bash
flyctl secrets set DATABASE_URL="..." JWT_SECRET="..." JWT_EXPIRES_IN="7d" NODE_ENV="production"
```
4. Add `FLY_API_TOKEN` to GitHub repository secrets
5. Push to main — GitHub Actions handles the rest