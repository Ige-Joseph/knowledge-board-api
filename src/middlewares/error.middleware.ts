import { Request, Response, NextFunction } from "express"
import AppError from "../utils/AppError"
import logger from "../lib/logger"

const errorMiddleware = (
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
) => {
  if (err instanceof AppError) {
    logger.warn(`AppError: ${err.message}`, { statusCode: err.statusCode })
    res.status(err.statusCode).json({
      success: false,
      message: err.message,
    })
    return
  }

  logger.error("Unexpected error", { error: err.message, stack: err.stack })
  res.status(500).json({
    success: false,
    message: "Internal server error",
  })
}

export default errorMiddleware