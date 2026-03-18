import express from "express"
import { createServer } from "http"
import { env } from "./config/env"
import errorMiddleware from "./middlewares/error.middleware"
import prisma from "./lib/prisma"

import authRoutes from "./modules/auth/auth.routes"
import boardRoutes from "./modules/board/board.routes"
import columnRoutes from "./modules/column/column.routes"
import cardRoutes from "./modules/card/card.routes"
import tagRoutes from "./modules/tag/tag.routes"
import swaggerUi from "swagger-ui-express"
import { swaggerSpec } from "./config/swagger"
import cors from "cors"
import commentRoutes from "./modules/comment/comment.routes"
import { initSocket } from "./lib/socket"

const app = express()
const httpServer = createServer(app)

// initialize socket.io
initSocket(httpServer)

app.use(cors())
app.use(express.json())

// health check
app.get("/health", async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`
    res.json({ success: true, message: "Server is running and DB is connected" })
  } catch {
    res.status(500).json({ success: false, message: "DB connection failed" })
  }
})

// routes
app.use("/api/auth", authRoutes)
app.use("/api/boards", boardRoutes)
app.use("/api/boards/:boardId/columns", columnRoutes)
app.use("/api/columns/:columnId/cards", cardRoutes)
app.use("/api/tags", tagRoutes)
app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec))
app.use("/api/cards/:cardId/comments", commentRoutes)

app.use(errorMiddleware)

httpServer.listen(env.port, () => {
  console.log(`Server running on port ${env.port}`)
})

export default app