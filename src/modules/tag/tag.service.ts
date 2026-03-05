import prisma from "../../lib/prisma"
import AppError from "../../utils/AppError"
import tagRepository from "./tag.repository"
import { CreateTagInput } from "./tag.validator"

const tagService = {
  async createTag(data: CreateTagInput) {
    const existing = await prisma.tag.findUnique({
      where: { name: data.name }
    })
    if (existing) throw new AppError("Tag already exists", 409)
    return tagRepository.create(data)
  },

  async getAllTags() {
    return tagRepository.findAll()
  },
}

export default tagService