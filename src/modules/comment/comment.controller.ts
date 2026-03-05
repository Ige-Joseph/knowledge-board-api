import { Response, NextFunction } from "express"
import { AuthRequest } from "../../middlewares/auth.middleware"
import commentService from "./comment.service"
import { sendSuccess } from "../../utils/response"

const commentController = {
  async createComment(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const comment = await commentService.createComment(
        req.user!.id,
        req.params.cardId as string,
        req.body
      )
      sendSuccess(res, comment, 201)
    } catch (err) {
      next(err)
    }
  },

  async getCommentsByCard(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const comments = await commentService.getCommentsByCard(
        req.user!.id,
        req.params.cardId as string
      )
      sendSuccess(res, comments)
    } catch (err) {
      next(err)
    }
  },

  async updateComment(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const comment = await commentService.updateComment(
        req.user!.id,
        req.params.id as string,
        req.body
      )
      sendSuccess(res, comment)
    } catch (err) {
      next(err)
    }
  },

  async deleteComment(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      await commentService.deleteComment(req.user!.id, req.params.id as string)
      sendSuccess(res, { message: "Comment deleted" })
    } catch (err) {
      next(err)
    }
  },
}

export default commentController