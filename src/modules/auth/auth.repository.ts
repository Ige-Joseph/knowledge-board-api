import prisma from "../../lib/prisma"
import { RegisterInput } from "./auth.validator"

const authRepository = {
  async findByEmail(email: string) {
    return prisma.user.findUnique({ where: { email } })
  },

  async createUser(data: RegisterInput & { password: string }) {
    return prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        password: data.password,
      },
    })
  },
}

export default authRepository