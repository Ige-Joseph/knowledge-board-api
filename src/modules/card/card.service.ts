import AppError from "../../utils/AppError"
import columnRepository from "../column/column.repository"
import boardRepository from "../board/board.repository"
import cardRepository from "./card.repository"
import { CreateCardInput, UpdateCardInput, AssignTagsInput } from "./card.validator"

const cardService = {
  async createCard(userId: string, columnId: string, data: CreateCardInput) {
    const column = await columnRepository.findById(columnId)
    if (!column) throw new AppError("Column not found", 404)

    const board = await boardRepository.findById(column.boardId)
    if (board?.userId !== userId) throw new AppError("Forbidden", 403)

    return cardRepository.create(columnId, data)
  },

  async getCardsByColumn(userId: string, columnId: string) {
    const column = await columnRepository.findById(columnId)
    if (!column) throw new AppError("Column not found", 404)

    const board = await boardRepository.findById(column.boardId)
    if (board?.userId !== userId) throw new AppError("Forbidden", 403)

    return cardRepository.findByColumn(columnId)
  },

  async updateCard(userId: string, cardId: string, data: UpdateCardInput) {
    const card = await cardRepository.findById(cardId)
    if (!card) throw new AppError("Card not found", 404)

    const column = await columnRepository.findById(card.columnId)
    const board = await boardRepository.findById(column!.boardId)
    if (board?.userId !== userId) throw new AppError("Forbidden", 403)

    return cardRepository.update(cardId, data)
  },

  async deleteCard(userId: string, cardId: string) {
    const card = await cardRepository.findById(cardId)
    if (!card) throw new AppError("Card not found", 404)

    const column = await columnRepository.findById(card.columnId)
    const board = await boardRepository.findById(column!.boardId)
    if (board?.userId !== userId) throw new AppError("Forbidden", 403)

    return cardRepository.delete(cardId)
  },

    async assignTags(userId: string, cardId: string, data: AssignTagsInput) {
    const card = await cardRepository.findById(cardId)
    if (!card) throw new AppError("Card not found", 404)

    const column = await columnRepository.findById(card.columnId)
    const board = await boardRepository.findById(column!.boardId)
    if (board?.userId !== userId) throw new AppError("Forbidden", 403)

    return cardRepository.assignTags(cardId, data.tagIds)
    },
}

export default cardService