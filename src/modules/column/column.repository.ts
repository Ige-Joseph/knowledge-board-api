import prisma from "../../lib/prisma"
import { CreateColumnInput, UpdateColumnInput } from "./column.validator"

const columnRepository = {
  async create(boardId: string, data: CreateColumnInput) {
    return prisma.column.create({ data: { ...data, boardId } })
  },

  async findById(id: string) {
    return prisma.column.findUnique({ where: { id } })
  },

  async update(id: string, data: UpdateColumnInput) {
    return prisma.column.update({ where: { id }, data })
  },

  async delete(id: string) {
    return prisma.column.delete({ where: { id } })
  },
}

export default columnRepository