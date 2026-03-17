import prisma from "../../lib/prisma"
import { CreateCardInput, UpdateCardInput } from "./card.validator"

const cardRepository = {
  async create(columnId: string, data: CreateCardInput, position: number = 0) {
    return prisma.card.create({
      data: {
        ...data,
        dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
        columnId,
        position,
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
      orderBy: { position: "asc" },
    })
  },

  async update(id: string, data: UpdateCardInput) {
    return prisma.card.update({
      where: { id },
      data: {
        title: data.title,
        description: data.description,
        dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
        version: { increment: 1 },
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

  async updatePosition(id: string, position: number) {
    return prisma.card.update({
      where: { id },
      data: { position },
    })
  },

  async shiftPositionsDown(columnId: string, fromPosition: number, toPosition: number) {
    return prisma.card.updateMany({
      where: {
        columnId,
        position: { gte: fromPosition, lte: toPosition },
      },
      data: { position: { increment: 1 } },
    })
  },

  async shiftPositionsUp(columnId: string, fromPosition: number, toPosition: number) {
    return prisma.card.updateMany({
      where: {
        columnId,
        position: { gte: fromPosition, lte: toPosition },
      },
      data: { position: { decrement: 1 } },
    })
  },

  async moveToColumn(id: string, columnId: string, position: number) {
    return prisma.card.update({
      where: { id },
      data: { columnId, position },
    })
  },

  async getMaxPosition(columnId: string) {
    const result = await prisma.card.aggregate({
      where: { columnId },
      _max: { position: true },
    })
    return result._max.position ?? -1
  },
  
}

export default cardRepository