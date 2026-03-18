import { Response, NextFunction } from "express"
import { AuthRequest } from "../../middlewares/auth.middleware"
import boardService from "./board.service"
import { sendSuccess } from "../../utils/response"

const boardController = {
  async createBoard(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const board = await boardService.createBoard(req.user!.id, req.body)
      sendSuccess(res, board, 201)
    } catch (err) {
      next(err)
    }
  },

  async getUserBoards(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const page = parseInt(req.query.page as string) || 1
      const limit = parseInt(req.query.limit as string) || 10
      const result = await boardService.getUserBoards(req.user!.id, page, limit)
      sendSuccess(res, result)
    } catch (err) {
      next(err)
    }
  },

  async updateBoard(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const board = await boardService.updateBoard(req.user!.id, req.params.id as string, req.body)
      sendSuccess(res, board)
    } catch (err) {
      next(err)
    }
  },

  async deleteBoard(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      await boardService.deleteBoard(req.user!.id, req.params.id as string)
      sendSuccess(res, { message: "Board deleted" })
    } catch (err) {
      next(err)
    }
  },
}

export default boardController