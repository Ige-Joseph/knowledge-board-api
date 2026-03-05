import { Request, Response, NextFunction } from "express"
import authService from "./auth.service"
import { sendSuccess } from "../../utils/response"

const authController = {
  async register(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await authService.register(req.body)
      sendSuccess(res, result, 201)
    } catch (err) {
      next(err)
    }
  },

  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await authService.login(req.body)
      sendSuccess(res, result)
    } catch (err) {
      next(err)
    }
  },
}

export default authController