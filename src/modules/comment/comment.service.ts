import AppError from "../../utils/AppError"
import cardRepository from "../card/card.repository"
import columnRepository from "../column/column.repository"
import boardRepository from "../board/board.repository"
import commentRepository from "./comment.repository"
import { CreateCommentInput, UpdateCommentInput } from "./comment.validator"

const commentService = {
  async createComment(userId: string, cardId: string, data: CreateCommentInput) {
    const card = await cardRepository.findById(cardId)
    if (!card) throw new AppError("Card not found", 404)

    const column = await columnRepository.findById(card.columnId)
    const board = await boardRepository.findById(column!.boardId)
    if (board?.userId !== userId) throw new AppError("Forbidden", 403)

    return commentRepository.create(cardId, userId, data)
  },

  async getCommentsByCard(userId: string, cardId: string) {
    const card = await cardRepository.findById(cardId)
    if (!card) throw new AppError("Card not found", 404)

    const column = await columnRepository.findById(card.columnId)
    const board = await boardRepository.findById(column!.boardId)
    if (board?.userId !== userId) throw new AppError("Forbidden", 403)

    return commentRepository.findByCard(cardId)
  },

  async updateComment(userId: string, commentId: string, data: UpdateCommentInput) {
    const comment = await commentRepository.findById(commentId)
    if (!comment) throw new AppError("Comment not found", 404)

    // only the author can edit their comment
    if (comment.userId !== userId) throw new AppError("Forbidden", 403)

    return commentRepository.update(commentId, data)
  },

  async deleteComment(userId: string, commentId: string) {
    const comment = await commentRepository.findById(commentId)
    if (!comment) throw new AppError("Comment not found", 404)

    // only the author can delete their comment
    if (comment.userId !== userId) throw new AppError("Forbidden", 403)

    return commentRepository.delete(commentId)
  },


  async createReply(userId: string, cardId: string, parentId: string, content: string) {
    const card = await cardRepository.findById(cardId)
    if (!card) throw new AppError("Card not found", 404)

    const column = await columnRepository.findById(card.columnId)
    const board = await boardRepository.findById(column!.boardId)
    if (board?.userId !== userId) throw new AppError("Forbidden", 403)

    const parentComment = await commentRepository.findById(parentId)
    if (!parentComment) throw new AppError("Parent comment not found", 404)

    // only allow 2 levels — replies cannot be replied to
    if (parentComment.parentId !== null) {
      throw new AppError("Cannot reply to a reply — maximum 2 levels allowed", 400)
    }

    return commentRepository.createReply(cardId, userId, parentId, content)
  },
}

export default commentService