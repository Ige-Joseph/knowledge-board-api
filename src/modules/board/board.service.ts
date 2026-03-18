import AppError from "../../utils/AppError"
import boardRepository from "./board.repository"
import { CreateBoardInput, UpdateBoardInput } from "./board.validator"

const boardService = {
  async createBoard(userId: string, data: CreateBoardInput) {
    return boardRepository.create(userId, data)
  },

  async getUserBoards(userId: string, page: number = 1, limit: number = 10) {
    return boardRepository.findAllByUser(userId, page, limit)
  },

  async updateBoard(userId: string, boardId: string, data: UpdateBoardInput) {
    const board = await boardRepository.findById(boardId)
    if (!board) throw new AppError("Board not found", 404)
    if (board.userId !== userId) throw new AppError("Forbidden", 403)
    return boardRepository.update(boardId, data)
  },

  async deleteBoard(userId: string, boardId: string) {
    const board = await boardRepository.findById(boardId)
    if (!board) throw new AppError("Board not found", 404)
    if (board.userId !== userId) throw new AppError("Forbidden", 403)
    return boardRepository.delete(boardId)
  },
}

export default boardService