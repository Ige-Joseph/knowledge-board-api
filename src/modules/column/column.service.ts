import AppError from "../../utils/AppError"
import boardRepository from "../board/board.repository"
import columnRepository from "./column.repository"
import { CreateColumnInput, UpdateColumnInput } from "./column.validator"

const columnService = {
  async createColumn(userId: string, boardId: string, data: CreateColumnInput) {
    const board = await boardRepository.findById(boardId)
    if (!board) throw new AppError("Board not found", 404)
    if (board.userId !== userId) throw new AppError("Forbidden", 403)
    return columnRepository.create(boardId, data)
  },

  async updateColumn(userId: string, columnId: string, data: UpdateColumnInput) {
    const column = await columnRepository.findById(columnId)
    if (!column) throw new AppError("Column not found", 404)

    const board = await boardRepository.findById(column.boardId)
    if (board?.userId !== userId) throw new AppError("Forbidden", 403)

    return columnRepository.update(columnId, data)
  },

  async deleteColumn(userId: string, columnId: string) {
    const column = await columnRepository.findById(columnId)
    if (!column) throw new AppError("Column not found", 404)

    const board = await boardRepository.findById(column.boardId)
    if (board?.userId !== userId) throw new AppError("Forbidden", 403)

    return columnRepository.delete(columnId)
  },
}

export default columnService