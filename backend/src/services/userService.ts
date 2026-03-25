import { v4 as uuidv4 } from 'uuid'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import nodemailer from 'nodemailer'
import { User, UserRegistration, UserLogin, UserProfile, JWTPayload } from '../types/user'

const users: Map<string, User> = new Map()
const emailIndex: Map<string, string> = new Map()
const usernameIndex: Map<string, string> = new Map()

export class UserService {
  private readonly jwtSecret: string
  private readonly jwtExpiresIn: string
  private readonly saltRounds: number = 10

  constructor() {
    this.jwtSecret = process.env.JWT_SECRET || 'default_secret_change_in_production'
    this.jwtExpiresIn = process.env.JWT_EXPIRES_IN || '7d'
  }

  async register(data: UserRegistration): Promise<{ user: UserProfile; token: string }> {
    if (emailIndex.has(data.email.toLowerCase())) {
      throw new Error('该邮箱已被注册')
    }

    if (usernameIndex.has(data.username.toLowerCase())) {
      throw new Error('该用户名已被使用')
    }

    const passwordHash = await bcrypt.hash(data.password, this.saltRounds)
    
    const user: User = {
      id: uuidv4(),
      username: data.username,
      email: data.email.toLowerCase(),
      passwordHash,
      createdAt: new Date(),
      updatedAt: new Date()
    }

    users.set(user.id, user)
    emailIndex.set(user.email, user.id)
    usernameIndex.set(user.username.toLowerCase(), user.id)

    const token = this.generateToken(user)
    
    return {
      user: this.toProfile(user),
      token
    }
  }

  async login(data: UserLogin): Promise<{ user: UserProfile; token: string }> {
    const userId = emailIndex.get(data.email.toLowerCase())
    
    if (!userId) {
      throw new Error('邮箱或密码错误')
    }

    const user = users.get(userId)
    
    if (!user) {
      throw new Error('邮箱或密码错误')
    }

    const isPasswordValid = await bcrypt.compare(data.password, user.passwordHash)
    
    if (!isPasswordValid) {
      throw new Error('邮箱或密码错误')
    }

    const token = this.generateToken(user)
    
    return {
      user: this.toProfile(user),
      token
    }
  }

  async getProfile(userId: string): Promise<UserProfile | null> {
    const user = users.get(userId)
    return user ? this.toProfile(user) : null
  }

  async updateProfile(userId: string, data: { username?: string; avatar?: string }): Promise<UserProfile> {
    const user = users.get(userId)
    
    if (!user) {
      throw new Error('用户不存在')
    }

    if (data.username && data.username !== user.username) {
      if (usernameIndex.has(data.username.toLowerCase())) {
        throw new Error('该用户名已被使用')
      }
      usernameIndex.delete(user.username.toLowerCase())
      user.username = data.username
      usernameIndex.set(data.username.toLowerCase(), userId)
    }

    if (data.avatar !== undefined) {
      user.avatar = data.avatar
    }

    user.updatedAt = new Date()
    users.set(userId, user)

    return this.toProfile(user)
  }

  async changePassword(userId: string, oldPassword: string, newPassword: string): Promise<void> {
    const user = users.get(userId)
    
    if (!user) {
      throw new Error('用户不存在')
    }

    const isPasswordValid = await bcrypt.compare(oldPassword, user.passwordHash)
    
    if (!isPasswordValid) {
      throw new Error('原密码错误')
    }

    user.passwordHash = await bcrypt.hash(newPassword, this.saltRounds)
    user.updatedAt = new Date()
    users.set(userId, user)
  }

  async forgotPassword(email: string): Promise<void> {
    const userId = emailIndex.get(email.toLowerCase())
    
    if (!userId) {
      return
    }

    const user = users.get(userId)
    
    if (!user) {
      return
    }

    const resetToken = uuidv4()
    const resetExpires = new Date(Date.now() + 3600000)

    user.resetPasswordToken = resetToken
    user.resetPasswordExpires = resetExpires
    users.set(userId, user)

    await this.sendResetPasswordEmail(user.email, resetToken)
  }

  async resetPassword(token: string, newPassword: string): Promise<void> {
    let targetUser: User | null = null
    
    for (const user of users.values()) {
      if (user.resetPasswordToken === token && user.resetPasswordExpires && user.resetPasswordExpires > new Date()) {
        targetUser = user
        break
      }
    }

    if (!targetUser) {
      throw new Error('重置链接无效或已过期')
    }

    targetUser.passwordHash = await bcrypt.hash(newPassword, this.saltRounds)
    targetUser.resetPasswordToken = undefined
    targetUser.resetPasswordExpires = undefined
    targetUser.updatedAt = new Date()
    users.set(targetUser.id, targetUser)
  }

  verifyToken(token: string): JWTPayload {
    try {
      return jwt.verify(token, this.jwtSecret) as JWTPayload
    } catch {
      throw new Error('无效的令牌')
    }
  }

  private generateToken(user: User): string {
    return jwt.sign(
      { userId: user.id, email: user.email },
      this.jwtSecret,
      { expiresIn: this.jwtExpiresIn }
    )
  }

  private toProfile(user: User): UserProfile {
    return {
      id: user.id,
      username: user.username,
      email: user.email,
      avatar: user.avatar,
      createdAt: user.createdAt
    }
  }

  private async sendResetPasswordEmail(email: string, token: string): Promise<void> {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    })

    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${token}`

    await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to: email,
      subject: '重置密码 - 音乐歌单转换工具',
      html: `
        <h1>重置密码</h1>
        <p>您收到这封邮件是因为您请求重置密码。</p>
        <p>请点击以下链接重置密码：</p>
        <a href="${resetUrl}">${resetUrl}</a>
        <p>此链接将在1小时后过期。</p>
        <p>如果您没有请求重置密码，请忽略此邮件。</p>
      `
    })
  }
}

export const userService = new UserService()
