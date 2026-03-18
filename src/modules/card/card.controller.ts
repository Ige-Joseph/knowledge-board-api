import { Response, NextFunction } from "express"
import { AuthRequest } from "../../middlewares/auth.middleware"
import cardService from "./card.service"
import { sendSuccess } from "../../utils/response"

const cardController = {
  async createCard(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const card = await cardService.createCard(req.user!.id, req.params.columnId as string, req.body)
      sendSuccess(res, card, 201)
    } catch (err) {
      next(err)
    }
  },

  async getCardsByColumn(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const page = parseInt(req.query.page as string) || 1
      const limit = parseInt(req.query.limit as string) || 10
      const cards = await cardService.getCardsByColumn(
        req.user!.id,
        req.params.columnId as string,
        page,
        limit
      )
      sendSuccess(res, cards)
    } catch (err) {
      next(err)
    }
  },

  async updateCard(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const card = await cardService.updateCard(req.user!.id, req.params.id as string, req.body)
      sendSuccess(res, card)
    } catch (err) {
      next(err)
    }
  },

  async deleteCard(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      await cardService.deleteCard(req.user!.id, req.params.id as string)
      sendSuccess(res, { message: "Card deleted" })
    } catch (err) {
      next(err)
    }
  },

  async assignTags(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const card = await cardService.assignTags(req.user!.id, req.params.id as string, req.body)
      sendSuccess(res, card)
    } catch (err) {
      next(err)
    }
  },


  async reorderCard(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const card = await cardService.reorderCard(
        req.user!.id,
        req.params.id as string,
        req.body.position
      )
      sendSuccess(res, card)
    } catch (err) {
      next(err)
    }
  },

  async moveCard(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const card = await cardService.moveCardToColumn(
        req.user!.id,
        req.params.id as string,
        req.body.targetColumnId,
        req.body.position
      )
      sendSuccess(res, card)
    } catch (err) {
      next(err)
    }
  },

}

export default cardController