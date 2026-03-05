import { Request, Response, NextFunction } from "express"
import jwt from "jsonwebtoken"
import { env } from "../config/env"
import AppError from "../utils/AppError"

export interface AuthRequest extends Request {
  user?: { id: string; email: string }
}

const authMiddleware = (req: AuthRequest, _res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return next(new AppError("No token provided", 401))
  }

  const token = authHeader.split(" ")[1]

  try {
    const decoded = jwt.verify(token, env.jwtSecret) as { id: string; email: string }
    req.user = decoded
    next()
  } catch {
    return next(new AppError("Invalid or expired token", 401))
  }
}

export default authMiddleware