import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken"
import { env } from "../../config/env"
import AppError from "../../utils/AppError"
import authRepository from "./auth.repository"
import { RegisterInput, LoginInput } from "./auth.validator"

const authService = {
  async register(data: RegisterInput) {
    const existing = await authRepository.findByEmail(data.email)
    if (existing) throw new AppError("Email already in use", 409)

    const hashed = await bcrypt.hash(data.password, 10)
    const user = await authRepository.createUser({ ...data, password: hashed })

    const token = jwt.sign(
      { id: user.id, email: user.email },
      env.jwtSecret as string,
      { expiresIn: "7d" }
    )

    return {
      token,
      user: { id: user.id, name: user.name, email: user.email },
    }
  },

  async login(data: LoginInput) {
    const user = await authRepository.findByEmail(data.email)
    if (!user) throw new AppError("Invalid credentials", 401)

    const valid = await bcrypt.compare(data.password, user.password)
    if (!valid) throw new AppError("Invalid credentials", 401)

    const token = jwt.sign(
      { id: user.id, email: user.email },
      env.jwtSecret as string,
      { expiresIn: "7d" }
    )

    return {
      token,
      user: { id: user.id, name: user.name, email: user.email },
    }
  },
}

export default authService