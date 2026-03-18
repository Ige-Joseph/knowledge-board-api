import { Server as SocketIOServer } from "socket.io"
import { Server as HttpServer } from "http"
import logger from "./logger"

let io: SocketIOServer

export const initSocket = (httpServer: HttpServer) => {
  io = new SocketIOServer(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    },
  })

  io.on("connection", (socket) => {
    logger.info(`Client connected: ${socket.id}`)

    socket.on("join_board", (boardId: string) => {
      socket.join(boardId)
      logger.info(`Client ${socket.id} joined board ${boardId}`)
    })

    socket.on("leave_board", (boardId: string) => {
      socket.leave(boardId)
      logger.info(`Client ${socket.id} left board ${boardId}`)
    })

    socket.on("disconnect", () => {
      logger.info(`Client disconnected: ${socket.id}`)
    })
  })

  return io
}

export const getIO = () => {
  if (!io) throw new Error("Socket.io not initialized")
  return io
}