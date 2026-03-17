import swaggerJsdoc from "swagger-jsdoc"

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Collaborative Knowledge Board API",
      version: "1.0.0",
      description: "REST API for a collaborative workspace board system",
    },
    servers: [
      {
        url: "https://knowledge-board-api.fly.dev",
        description: "Production server",
      },
      {
        url: "http://localhost:3000",
        description: "Development server",
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
      schemas: {
        RegisterInput: {
          type: "object",
          required: ["name", "email", "password"],
          properties: {
            name: { type: "string", example: "Joseph" },
            email: { type: "string", example: "joseph@test.com" },
            password: { type: "string", example: "password123" },
          },
        },
        LoginInput: {
          type: "object",
          required: ["email", "password"],
          properties: {
            email: { type: "string", example: "joseph@test.com" },
            password: { type: "string", example: "password123" },
          },
        },
        BoardInput: {
          type: "object",
          required: ["name"],
          properties: {
            name: { type: "string", example: "My First Board" },
          },
        },
        ColumnInput: {
          type: "object",
          required: ["name", "position"],
          properties: {
            name: { type: "string", example: "To Do" },
            position: { type: "number", example: 0 },
          },
        },
        CardInput: {
          type: "object",
          required: ["title"],
          properties: {
            title: { type: "string", example: "Fix login bug" },
            description: { type: "string", example: "The login form breaks on mobile" },
            dueDate: { type: "string", format: "date-time", example: "2025-12-31T00:00:00.000Z" },
          },
        },
        TagInput: {
          type: "object",
          required: ["name"],
          properties: {
            name: { type: "string", example: "Urgent" },
          },
        },
        AssignTagsInput: {
          type: "object",
          required: ["tagIds"],
          properties: {
            tagIds: {
              type: "array",
              items: { type: "string" },
              example: ["tag-uuid-here"],
            },
          },
        },
        CommentInput: {
          type: "object",
          required: ["content"],
          properties: {
            content: { type: "string", example: "This needs to be fixed asap" },
          },
        },
        ReorderCardInput: {
          type: "object",
          required: ["position"],
          properties: {
            position: { type: "integer", minimum: 0, example: 1 },
          },
        },
        MoveCardInput: {
          type: "object",
          required: ["targetColumnId"],
          properties: {
            targetColumnId: { type: "string", example: "column-uuid-here" },
            position: { type: "integer", minimum: 0, example: 0 },
          },
        },
      },
    },
    security: [{ bearerAuth: [] }],
    paths: {
      "/api/auth/register": {
        post: {
          tags: ["Auth"],
          summary: "Register a new user",
          security: [],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/RegisterInput" },
              },
            },
          },
          responses: {
            201: { description: "User registered successfully" },
            409: { description: "Email already in use" },
          },
        },
      },
      "/api/auth/login": {
        post: {
          tags: ["Auth"],
          summary: "Login user",
          security: [],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/LoginInput" },
              },
            },
          },
          responses: {
            200: { description: "Login successful, returns JWT token" },
            401: { description: "Invalid credentials" },
          },
        },
      },
      "/api/boards": {
        post: {
          tags: ["Boards"],
          summary: "Create a board",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/BoardInput" },
              },
            },
          },
          responses: {
            201: { description: "Board created" },
            401: { description: "Unauthorized" },
          },
        },
        get: {
          tags: ["Boards"],
          summary: "Get all boards for logged in user",
          responses: {
            200: { description: "List of boards" },
            401: { description: "Unauthorized" },
          },
        },
      },
      "/api/boards/{id}": {
        put: {
          tags: ["Boards"],
          summary: "Update a board",
          parameters: [
            { name: "id", in: "path", required: true, schema: { type: "string" } },
          ],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/BoardInput" },
              },
            },
          },
          responses: {
            200: { description: "Board updated" },
            403: { description: "Forbidden" },
            404: { description: "Board not found" },
          },
        },
        delete: {
          tags: ["Boards"],
          summary: "Delete a board",
          parameters: [
            { name: "id", in: "path", required: true, schema: { type: "string" } },
          ],
          responses: {
            200: { description: "Board deleted" },
            403: { description: "Forbidden" },
            404: { description: "Board not found" },
          },
        },
      },
      "/api/boards/{boardId}/columns": {
        post: {
          tags: ["Columns"],
          summary: "Create a column inside a board",
          parameters: [
            { name: "boardId", in: "path", required: true, schema: { type: "string" } },
          ],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ColumnInput" },
              },
            },
          },
          responses: {
            201: { description: "Column created" },
            403: { description: "Forbidden" },
            404: { description: "Board not found" },
          },
        },
      },
      "/api/boards/{boardId}/columns/{id}": {
        put: {
          tags: ["Columns"],
          summary: "Update a column",
          parameters: [
            { name: "boardId", in: "path", required: true, schema: { type: "string" } },
            { name: "id", in: "path", required: true, schema: { type: "string" } },
          ],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ColumnInput" },
              },
            },
          },
          responses: {
            200: { description: "Column updated" },
            403: { description: "Forbidden" },
            404: { description: "Column not found" },
          },
        },
        delete: {
          tags: ["Columns"],
          summary: "Delete a column",
          parameters: [
            { name: "boardId", in: "path", required: true, schema: { type: "string" } },
            { name: "id", in: "path", required: true, schema: { type: "string" } },
          ],
          responses: {
            200: { description: "Column deleted" },
            403: { description: "Forbidden" },
            404: { description: "Column not found" },
          },
        },
      },
      "/api/columns/{columnId}/cards": {
        post: {
          tags: ["Cards"],
          summary: "Create a card inside a column",
          parameters: [
            { name: "columnId", in: "path", required: true, schema: { type: "string" } },
          ],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/CardInput" },
              },
            },
          },
          responses: {
            201: { description: "Card created" },
            403: { description: "Forbidden" },
            404: { description: "Column not found" },
          },
        },
        get: {
          tags: ["Cards"],
          summary: "Get all cards in a column",
          parameters: [
            { name: "columnId", in: "path", required: true, schema: { type: "string" } },
          ],
          responses: {
            200: { description: "List of cards" },
            403: { description: "Forbidden" },
            404: { description: "Column not found" },
          },
        },
      },
      "/api/columns/{columnId}/cards/{id}": {
        put: {
          tags: ["Cards"],
          summary: "Update a card",
          parameters: [
            { name: "columnId", in: "path", required: true, schema: { type: "string" } },
            { name: "id", in: "path", required: true, schema: { type: "string" } },
          ],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/CardInput" },
              },
            },
          },
          responses: {
            200: { description: "Card updated" },
            403: { description: "Forbidden" },
            404: { description: "Card not found" },
          },
        },
        delete: {
          tags: ["Cards"],
          summary: "Delete a card",
          parameters: [
            { name: "columnId", in: "path", required: true, schema: { type: "string" } },
            { name: "id", in: "path", required: true, schema: { type: "string" } },
          ],
          responses: {
            200: { description: "Card deleted" },
            403: { description: "Forbidden" },
            404: { description: "Card not found" },
          },
        },
      },
      "/api/columns/{columnId}/cards/{id}/tags": {
        post: {
          tags: ["Cards"],
          summary: "Assign tags to a card",
          parameters: [
            { name: "columnId", in: "path", required: true, schema: { type: "string" } },
            { name: "id", in: "path", required: true, schema: { type: "string" } },
          ],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/AssignTagsInput" },
              },
            },
          },
          responses: {
            200: { description: "Tags assigned to card" },
            403: { description: "Forbidden" },
            404: { description: "Card not found" },
          },
        },
      },
      "/api/columns/{columnId}/cards/{id}/reorder": {
        patch: {
          tags: ["Cards"],
          summary: "Reorder a card within a column",
          parameters: [
            { name: "columnId", in: "path", required: true, schema: { type: "string" } },
            { name: "id", in: "path", required: true, schema: { type: "string" } },
          ],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ReorderCardInput" },
              },
            },
          },
          responses: {
            200: { description: "Card reordered" },
            403: { description: "Forbidden" },
            404: { description: "Card not found" },
          },
        },
      },
      "/api/columns/{columnId}/cards/{id}/move": {
        patch: {
          tags: ["Cards"],
          summary: "Move a card to a different column",
          parameters: [
            { name: "columnId", in: "path", required: true, schema: { type: "string" } },
            { name: "id", in: "path", required: true, schema: { type: "string" } },
          ],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/MoveCardInput" },
              },
            },
          },
          responses: {
            200: { description: "Card moved" },
            403: { description: "Forbidden" },
            404: { description: "Card not found" },
          },
        },
      },
      "/api/tags": {
        post: {
          tags: ["Tags"],
          summary: "Create a tag",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/TagInput" },
              },
            },
          },
          responses: {
            201: { description: "Tag created" },
            409: { description: "Tag already exists" },
          },
        },
        get: {
          tags: ["Tags"],
          summary: "Get all tags",
          responses: {
            200: { description: "List of tags" },
          },
        },
      },
      "/api/cards/{cardId}/comments": {
        post: {
          tags: ["Comments"],
          summary: "Add a comment to a card",
          parameters: [
            { name: "cardId", in: "path", required: true, schema: { type: "string" } },
          ],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/CommentInput" },
              },
            },
          },
          responses: {
            201: { description: "Comment created" },
            403: { description: "Forbidden" },
            404: { description: "Card not found" },
          },
        },
        get: {
          tags: ["Comments"],
          summary: "Get all comments on a card",
          parameters: [
            { name: "cardId", in: "path", required: true, schema: { type: "string" } },
          ],
          responses: {
            200: { description: "List of comments" },
            403: { description: "Forbidden" },
            404: { description: "Card not found" },
          },
        },
      },
      "/api/cards/{cardId}/comments/{id}": {
        put: {
          tags: ["Comments"],
          summary: "Update a comment",
          parameters: [
            { name: "cardId", in: "path", required: true, schema: { type: "string" } },
            { name: "id", in: "path", required: true, schema: { type: "string" } },
          ],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/CommentInput" },
              },
            },
          },
          responses: {
            200: { description: "Comment updated" },
            403: { description: "Forbidden — not the author" },
            404: { description: "Comment not found" },
          },
        },
        delete: {
          tags: ["Comments"],
          summary: "Delete a comment",
          parameters: [
            { name: "cardId", in: "path", required: true, schema: { type: "string" } },
            { name: "id", in: "path", required: true, schema: { type: "string" } },
          ],
          responses: {
            200: { description: "Comment deleted" },
            403: { description: "Forbidden — not the author" },
            404: { description: "Comment not found" },
          },
        },
      },
    },
  },
  apis: [],
}

export const swaggerSpec = swaggerJsdoc(options)