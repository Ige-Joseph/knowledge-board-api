# Collaborative Knowledge Board API

A clean, scalable REST API powering a collaborative workspace application — built with Node.js, TypeScript, Express, Prisma, and PostgreSQL.

---

## Repository

[https://github.com/your-username/knowledge-board-api](https://github.com/your-username/knowledge-board-api)

---

## Table of Contents

- [Tech Stack](#tech-stack)
- [Database Schema Diagram](#database-schema-diagram)
- [Architecture & Folder Structure](#architecture--folder-structure)
- [Key Engineering Decisions](#key-engineering-decisions)
- [How Relationships Are Handled](#how-relationships-are-handled)
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
│   │ createdAt    │           Junction Table          │ columnId (FK) │           │
│   │ updatedAt    │                                   │ createdAt     │           │
│   └──────────────┘                                   │ updatedAt     │           │
│                                                      └───────────────┘           │
│   ┌──────────────┐                                                               │
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
```

### Entity Descriptions

| Entity | Description |
|---|---|
| User | Authenticated account that owns boards |
| Board | Top-level workspace container owned by a user |
| Column | Ordered stage within a board (e.g. "To Do", "In Progress") |
| Card | Task or item within a column, supports due dates |
| Tag | Free-floating label attachable to many cards |
| CardTag | Junction table resolving the Card ↔ Tag many-to-many relationship |
| Comment | Text comment on a card, written by a user |

---

## Architecture & Folder Structure

This project follows a **strict layered architecture** — each layer has a single responsibility and never crosses into another layer's concerns.

```
src/
├── config/
│   ├── env.ts               # Centralised environment variable access
│   └── swagger.ts           # OpenAPI/Swagger specification
├── lib/
│   └── prisma.ts            # Prisma client singleton
├── middlewares/
│   ├── auth.middleware.ts   # JWT verification, attaches req.user
│   ├── error.middleware.ts  # Global error handler
│   └── validate.middleware.ts # Zod schema validation
├── modules/
│   ├── auth/                # Register & login
│   ├── board/               # Board CRUD
│   ├── column/              # Column CRUD
│   ├── card/                # Card CRUD + tag assignment
│   ├── tag/                 # Tag creation & listing
│   └── comment/             # Comments on cards
│       ├── *.routes.ts      # URL definitions only
│       ├── *.controller.ts  # Receives request, calls service, returns response
│       ├── *.service.ts     # All business logic lives here
│       ├── *.repository.ts  # Database queries only (Prisma calls)
│       └── *.validator.ts   # Zod input schemas
├── types/
│   └── index.ts             # Shared TypeScript interfaces
├── utils/
│   ├── AppError.ts          # Custom error class with statusCode
│   └── response.ts          # Consistent JSON response helpers
└── app.ts                   # Express app setup and route mounting
```

### Why This Structure?

**Module-based organisation** groups all files for a feature together rather than grouping by file type. This means when working on boards, everything you need — routes, controller, service, repository, validator — is in one folder. This scales cleanly as the project grows.

**Layer separation** enforces a strict contract between each layer:

| Layer | Responsibility | What it must NOT do |
|---|---|---|
| Route | Map URL to controller | No logic |
| Controller | Receive request, return response | No DB calls, no business logic |
| Service | Business logic, ownership checks | No direct DB calls |
| Repository | Prisma queries only | No business logic |

This means business logic is never trapped inside controllers — the primary elimination criterion for this assessment.

---

## Key Engineering Decisions

### 1. Prisma v5 over v7
Prisma v7 introduced breaking changes requiring driver adapters for custom output paths. Prisma v5 uses the stable `@prisma/client` path and is what all production codebases currently use. Choosing stability over bleeding-edge avoids unnecessary complexity.

### 2. UUID primary keys over auto-increment integers
UUIDs (`@default(uuid())`) are used for all primary keys. This prevents sequential ID enumeration attacks, is safe for distributed systems, and avoids exposing record counts to clients.

### 3. Cascade deletes through the hierarchy
All foreign key relationships use `onDelete: Cascade`. This means deleting a User automatically deletes their Boards → Columns → Cards → Comments and CardTags. No orphaned data can accumulate in the database.

### 4. Ownership checks in the service layer
Every mutating operation (update, delete) verifies that the authenticated user owns the resource before proceeding. This logic lives exclusively in the service layer so it applies regardless of where the service is called from.

### 5. Comment authorship checks
Comments implement an additional layer of ownership — only the user who wrote a comment can edit or delete it. This is separate from board ownership and handled independently in the comment service.

### 6. Consistent response envelope
Every response follows the same structure:
```json
{ "success": true, "data": { ... } }
{ "success": false, "message": "..." }
```
This makes frontend integration predictable and errors easy to handle uniformly.

### 7. Zod validation before controllers
Input is validated at the middleware level before it ever reaches the controller. Invalid requests are rejected early with clear field-level error messages, keeping controller and service code clean.

### 8. Position field on columns
Columns carry an explicit `position` integer field to support ordered rendering on the frontend. Without this, columns would have no deterministic sort order.

---

## How Relationships Are Handled

### One-to-Many (Hierarchical)
The core data model is a strict top-down hierarchy:

```
User → Board → Column → Card → Comment
```

Each child entity holds a foreign key pointing to its parent. The child is a subset of the parent — a Card cannot exist without a Column, a Column cannot exist without a Board.

```prisma
model Column {
  boardId  String
  board    Board  @relation(fields: [boardId], references: [id], onDelete: Cascade)
}
```

### Many-to-Many (Tags)
Tags exist outside the hierarchy. A Tag can be attached to many Cards, and a Card can have many Tags. This cannot be expressed with a single foreign key on either side.

A `CardTag` junction table resolves this by recording every Card ↔ Tag connection as its own row. Both `cardId` and `tagId` together form the composite primary key, preventing duplicate tag assignments.

```prisma
model CardTag {
  cardId String
  tagId  String
  @@id([cardId, tagId])
}
```

Assigning tags to a card uses a replace strategy — existing tag assignments are cleared first, then the new set is inserted. This keeps the operation idempotent.

### Comments (Dual Ownership)
Comments belong to both a Card and a User. The card relationship determines where comments live in the hierarchy. The user relationship determines who can edit or delete them. Both cascade on delete — removing a card removes its comments, and removing a user removes their comments.

---

## Getting Started

### Prerequisites
- Node.js 18+
- A PostgreSQL database (Neon recommended)

### Installation

```bash
git clone https://github.com/your-username/knowledge-board-api
cd knowledge-board-api
npm install
```

### Database Setup

```bash
npx prisma migrate dev --name init
npx prisma generate
```

### Run Development Server

```bash
npm run dev
```

Server starts at `http://localhost:3000`

---

## Environment Variables

Create a `.env` file in the root (see `.env.example` for reference):

```env
DATABASE_URL="postgresql://user:password@host/dbname?sslmode=require"
JWT_SECRET="your-secret-key"
JWT_EXPIRES_IN="7d"
PORT=3000
```

---

## API Documentation

Interactive Swagger docs are available at:

```
http://localhost:3000/api/docs
```

Once deployed:

```
https://knowledge-board-api.fly.dev/api/docs
```

All protected endpoints require a Bearer token in the `Authorization` header:

```
Authorization: Bearer <your_jwt_token>
```

### Endpoint Summary

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | /api/auth/register | No | Register new user |
| POST | /api/auth/login | No | Login and get token |
| POST | /api/boards | Yes | Create a board |
| GET | /api/boards | Yes | Get user's boards |
| PUT | /api/boards/:id | Yes | Update a board |
| DELETE | /api/boards/:id | Yes | Delete a board |
| POST | /api/boards/:boardId/columns | Yes | Create a column |
| PUT | /api/boards/:boardId/columns/:id | Yes | Update a column |
| DELETE | /api/boards/:boardId/columns/:id | Yes | Delete a column |
| POST | /api/columns/:columnId/cards | Yes | Create a card |
| GET | /api/columns/:columnId/cards | Yes | Get cards in column |
| PUT | /api/columns/:columnId/cards/:id | Yes | Update a card |
| DELETE | /api/columns/:columnId/cards/:id | Yes | Delete a card |
| POST | /api/columns/:columnId/cards/:id/tags | Yes | Assign tags to card |
| POST | /api/tags | Yes | Create a tag |
| GET | /api/tags | Yes | Get all tags |
| POST | /api/cards/:cardId/comments | Yes | Add comment to card |
| GET | /api/cards/:cardId/comments | Yes | Get comments on card |
| PUT | /api/cards/:cardId/comments/:id | Yes | Update a comment |
| DELETE | /api/cards/:cardId/comments/:id | Yes | Delete a comment |

---

## Deployment

The API is deployed at: `https://knowledge-board-api.fly.dev`

Deployments are automated via GitHub Actions. Every push to the `main` branch triggers a build and deploy to Fly.io.

To deploy your own instance:

1. Install the Fly CLI and run `flyctl auth login`
2. Run `flyctl launch` in the project root
3. Set your environment variables:
```bash
flyctl secrets set DATABASE_URL="..." JWT_SECRET="..." JWT_EXPIRES_IN="7d"
```
4. Add your `FLY_API_TOKEN` to GitHub repository secrets
5. Push to main — GitHub Actions handles the rest