import { Response, NextFunction } from "express"
import { AuthRequest } from "../../middlewares/auth.middleware"
import columnService from "./column.service"
import { sendSuccess } from "../../utils/response"

const columnController = {
  async createColumn(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const column = await columnService.createColumn(req.user!.id, req.params.boardId as string, req.body)
      sendSuccess(res, column, 201)
    } catch (err) {
      next(err)
    }
  },

  async updateColumn(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const column = await columnService.updateColumn(req.user!.id, req.params.id as string, req.body)
      sendSuccess(res, column)
    } catch (err) {
      next(err)
    }
  },

  async deleteColumn(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      await columnService.deleteColumn(req.user!.id, req.params.id as string)
      sendSuccess(res, { message: "Column deleted" })
    } catch (err) {
      next(err)
    }
  },
}

export default columnController