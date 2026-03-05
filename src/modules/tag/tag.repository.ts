import prisma from "../../lib/prisma"
import { CreateTagInput } from "./tag.validator"

const tagRepository = {
  async create(data: CreateTagInput) {
    return prisma.tag.create({ data })
  },

  async findAll() {
    return prisma.tag.findMany({ orderBy: { name: "asc" } })
  },

  async findById(id: string) {
    return prisma.tag.findUnique({ where: { id } })
  },
}

export default tagRepository