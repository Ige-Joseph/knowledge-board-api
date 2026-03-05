import prisma from "../../lib/prisma"
import { CreateCardInput, UpdateCardInput } from "./card.validator"

const cardRepository = {
  async create(columnId: string, data: CreateCardInput) {
    return prisma.card.create({
      data: {
        ...data,
        dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
        columnId,
      },
    })
  },

  async findById(id: string) {
    return prisma.card.findUnique({
      where: { id },
      include: { tags: { include: { tag: true } } },
    })
  },

  async findByColumn(columnId: string) {
    return prisma.card.findMany({
      where: { columnId },
      include: { tags: { include: { tag: true } } },
      orderBy: { createdAt: "asc" },
    })
  },

  async update(id: string, data: UpdateCardInput) {
    return prisma.card.update({
      where: { id },
      data: {
        ...data,
        dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
      },
    })
  },

  async delete(id: string) {
    return prisma.card.delete({ where: { id } })
  },

  async assignTags(cardId: string, tagIds: string[]) {
    await prisma.cardTag.deleteMany({ where: { cardId } })
    await prisma.cardTag.createMany({
      data: tagIds.map((tagId) => ({ cardId, tagId })),
    })
    return prisma.card.findUnique({
      where: { id: cardId },
      include: { tags: { include: { tag: true } } },
    })
  },
}

export default cardRepository