export interface User {
  id: string
  username: string
  email: string
  passwordHash: string
  avatar?: string
  createdAt: Date
  updatedAt: Date
  resetPasswordToken?: string
  resetPasswordExpires?: Date
}

export interface UserRegistration {
  username: string
  email: string
  password: string
}

export interface UserLogin {
  email: string
  password: string
}

export interface UserProfile {
  id: string
  username: string
  email: string
  avatar?: string
  createdAt: Date
}

export interface AuthTokens {
  accessToken: string
  refreshToken?: string
}

export interface JWTPayload {
  userId: string
  email: string
  iat: number
  exp: number
}
