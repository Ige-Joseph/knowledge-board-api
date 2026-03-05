import prisma from "../../lib/prisma"
import { CreateBoardInput, UpdateBoardInput } from "./board.validator"

const boardRepository = {
  async create(userId: string, data: CreateBoardInput) {
    return prisma.board.create({ data: { ...data, userId } })
  },

  async findAllByUser(userId: string) {
    return prisma.board.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    })
  },

  async findById(id: string) {
    return prisma.board.findUnique({ where: { id } })
  },

  async update(id: string, data: UpdateBoardInput) {
    return prisma.board.update({ where: { id }, data })
  },

  async delete(id: string) {
    return prisma.board.delete({ where: { id } })
  },
}

export default boardRepository