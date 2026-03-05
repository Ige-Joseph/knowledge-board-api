import prisma from "../../lib/prisma"
import { CreateCommentInput, UpdateCommentInput } from "./comment.validator"

const commentRepository = {
  async create(cardId: string, userId: string, data: CreateCommentInput) {
    return prisma.comment.create({
      data: { ...data, cardId, userId },
      include: { user: { select: { id: true, name: true, email: true } } },
    })
  },

  async findByCard(cardId: string) {
    return prisma.comment.findMany({
      where: { cardId },
      include: { user: { select: { id: true, name: true, email: true } } },
      orderBy: { createdAt: "asc" },
    })
  },

  async findById(id: string) {
    return prisma.comment.findUnique({ where: { id } })
  },

  async update(id: string, data: UpdateCommentInput) {
    return prisma.comment.update({
      where: { id },
      data,
      include: { user: { select: { id: true, name: true, email: true } } },
    })
  },

  async delete(id: string) {
    return prisma.comment.delete({ where: { id } })
  },
}

export default commentRepository