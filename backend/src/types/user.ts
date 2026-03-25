export interface User {
  id: string
  username: string
  passwordHash: string
  avatar?: string
  createdAt: Date
  updatedAt: Date
}

export interface UserProfile {
  id: string
  username: string
  avatar?: string
  createdAt: Date
}

export interface JWTPayload {
  userId: string
  username: string
  iat: number
  exp: number
}
