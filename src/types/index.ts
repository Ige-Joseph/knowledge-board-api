export interface JwtPayload {
  id: string
  email: string
}

export interface ApiResponse<T> {
  success: boolean
  data?: T
  message?: string
}