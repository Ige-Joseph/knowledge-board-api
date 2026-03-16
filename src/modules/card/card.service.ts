import AppError from "../../utils/AppError"
import columnRepository from "../column/column.repository"
import boardRepository from "../board/board.repository"
import cardRepository from "./card.repository"
import { CreateCardInput, UpdateCardInput, AssignTagsInput } from "./card.validator"
import prisma from "../../lib/prisma"

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


    async reorderCard(userId: string, cardId: string, newPosition: number) {
    const card = await cardRepository.findById(cardId)
    if (!card) throw new AppError("Card not found", 404)

    const column = await columnRepository.findById(card.columnId)
    const board = await boardRepository.findById(column!.boardId)
    if (board?.userId !== userId) throw new AppError("Forbidden", 403)

    const currentPosition = card.position

    if (currentPosition === newPosition) return card

    await prisma.$transaction(async () => {
      if (newPosition < currentPosition) {
        // moving up — shift cards between newPosition and currentPosition down
        await cardRepository.shiftPositionsDown(card.columnId, newPosition, currentPosition - 1)
      } else {
        // moving down — shift cards between currentPosition and newPosition up
        await cardRepository.shiftPositionsUp(card.columnId, currentPosition + 1, newPosition)
      }
      await cardRepository.updatePosition(cardId, newPosition)
    })

    return cardRepository.findById(cardId)
  },

  async moveCardToColumn(userId: string, cardId: string, targetColumnId: string, newPosition?: number) {
    const card = await cardRepository.findById(cardId)
    if (!card) throw new AppError("Card not found", 404)

    const sourceColumn = await columnRepository.findById(card.columnId)
    const board = await boardRepository.findById(sourceColumn!.boardId)
    if (board?.userId !== userId) throw new AppError("Forbidden", 403)

    const targetColumn = await columnRepository.findById(targetColumnId)
    if (!targetColumn) throw new AppError("Target column not found", 404)

    // verify target column belongs to same board
    if (targetColumn.boardId !== board!.id) throw new AppError("Cannot move card to a different board", 400)

    await prisma.$transaction(async () => {
      // shift cards up in source column to fill the gap
      await cardRepository.shiftPositionsUp(card.columnId, card.position + 1, 9999)

      // determine position in target column
      const maxPosition = await cardRepository.getMaxPosition(targetColumnId)
      const targetPosition = newPosition !== undefined ? newPosition : maxPosition + 1

      // shift cards down in target column to make room
      if (newPosition !== undefined) {
        await cardRepository.shiftPositionsDown(targetColumnId, newPosition, 9999)
      }

      await cardRepository.moveToColumn(cardId, targetColumnId, targetPosition)
    })

    return cardRepository.findById(cardId)
  },
}

export default cardService