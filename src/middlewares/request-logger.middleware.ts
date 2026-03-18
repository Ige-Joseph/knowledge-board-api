import { Request, Response, NextFunction } from "express"
import logger from "../lib/logger"

const requestLogger = (req: Request, res: Response, next: NextFunction) => {
  const start = Date.now()

  res.on("finish", () => {
    const duration = Date.now() - start
    logger.info(`${req.method} ${req.path}`, {
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip,
    })
  })

  next()
}

export default requestLogger