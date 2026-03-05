import { Request, Response, NextFunction } from "express"
import tagService from "./tag.service"
import { sendSuccess } from "../../utils/response"

const tagController = {
  async createTag(req: Request, res: Response, next: NextFunction) {
    try {
      const tag = await tagService.createTag(req.body)
      sendSuccess(res, tag, 201)
    } catch (err) {
      next(err)
    }
  },

  async getAllTags(_req: Request, res: Response, next: NextFunction) {
    try {
      const tags = await tagService.getAllTags()
      sendSuccess(res, tags)
    } catch (err) {
      next(err)
    }
  },
}

export default tagController