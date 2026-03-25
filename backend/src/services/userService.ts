import { v4 as uuidv4 } from 'uuid'
import bcrypt from 'bcryptjs'
import jwt, { SignOptions } from 'jsonwebtoken'
import { User, UserProfile, JWTPayload } from '../types/user'
import fs from 'fs'
import path from 'path'

const DATA_DIR = path.join(__dirname, '../data')
const USERS_FILE = path.join(DATA_DIR, 'users.json')

interface UserData {
  users: Record<string, User>
  usernameIndex: Record<string, string>
}

function loadData(): UserData {
  try {
    if (fs.existsSync(USERS_FILE)) {
      const data = fs.readFileSync(USERS_FILE, 'utf-8')
      const parsed = JSON.parse(data)
      return {
        users: parsed.users || {},
        usernameIndex: parsed.usernameIndex || {}
      }
    }
    return { users: {}, usernameIndex: {} }
  } catch (error) {
    console.error('Error loading user data:', error)
    return { users: {}, usernameIndex: {} }
  }
}

function saveData(data: UserData): void {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true })
    }
    fs.writeFileSync(USERS_FILE, JSON.stringify(data, null, 2))
  } catch (error) {
    console.error('Error saving user data:', error)
  }
}

export class UserService {
  private readonly jwtSecret: string
  private readonly jwtExpiresIn: string
  private readonly saltRounds: number = 10

  constructor() {
    this.jwtSecret = process.env.JWT_SECRET || 'default_secret_change_in_production'
    this.jwtExpiresIn = process.env.JWT_EXPIRES_IN || '7d'
  }

  async register(username: string, password: string): Promise<{ user: UserProfile; token: string }> {
    const loadedData = loadData()
    
    const normalizedUsername = username.toLowerCase().trim()
    
    if (loadedData.usernameIndex[normalizedUsername]) {
      throw new Error('该用户名已被使用')
    }
    
    if (username.length < 2) {
      throw new Error('用户名至少2个字符')
    }
    
    if (password.length < 6) {
      throw new Error('密码长度至少6位')
    }
    
    const passwordHash = await bcrypt.hash(password, this.saltRounds)
    
    const user: User = {
      id: uuidv4(),
      username: username.trim(),
      passwordHash,
      createdAt: new Date(),
      updatedAt: new Date()
    }
    
    loadedData.users[user.id] = user
    loadedData.usernameIndex[normalizedUsername] = user.id
    
    saveData(loadedData)
    
    const token = this.generateToken(user)
    
    console.log(`[UserService] User registered: ${username}`)
    
    return {
      user: this.toProfile(user),
      token
    }
  }

  async login(username: string, password: string): Promise<{ user: UserProfile; token: string }> {
    const loadedData = loadData()
    const normalizedUsername = username.toLowerCase().trim()
    const userId = loadedData.usernameIndex[normalizedUsername]
    
    if (!userId) {
      console.log(`[UserService] User not found: ${username}`)
      throw new Error('用户名或密码错误')
    }
    
    const user = loadedData.users[userId]
    
    if (!user) {
      console.log(`[UserService] User data not found for id: ${userId}`)
      throw new Error('用户名或密码错误')
    }
    
    console.log(`[UserService] Attempting login for: ${username}`)
    console.log(`[UserService] Stored hash: ${user.passwordHash.substring(0, 20)}...`)
    
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash)
    
    console.log(`[UserService] Password valid: ${isPasswordValid}`)
    
    if (!isPasswordValid) {
      throw new Error('用户名或密码错误')
    }
    
    const token = this.generateToken(user)
    
    console.log(`[UserService] Login successful: ${username}`)
    
    return {
      user: this.toProfile(user),
      token
    }
  }

  async getProfile(userId: string): Promise<UserProfile | null> {
    const loadedData = loadData()
    const user = loadedData.users[userId]
    return user ? this.toProfile(user) : null
  }

  async updateProfile(userId: string, data: { username?: string; avatar?: string }): Promise<UserProfile> {
    const loadedData = loadData()
    const user = loadedData.users[userId]
    
    if (!user) {
      throw new Error('用户不存在')
    }
    
    if (data.username && data.username !== user.username) {
      const normalizedUsername = data.username.toLowerCase().trim()
      if (loadedData.usernameIndex[normalizedUsername] && loadedData.usernameIndex[normalizedUsername] !== userId) {
        throw new Error('该用户名已被使用')
      }
      
      const oldNormalizedUsername = user.username.toLowerCase().trim()
      delete loadedData.usernameIndex[oldNormalizedUsername]
      loadedData.usernameIndex[normalizedUsername] = userId
      user.username = data.username.trim()
    }
    
    if (data.avatar !== undefined) {
      user.avatar = data.avatar
    }
    
    user.updatedAt = new Date()
    loadedData.users[userId] = user
    saveData(loadedData)
    
    return this.toProfile(user)
  }

  async changePassword(userId: string, oldPassword: string, newPassword: string): Promise<void> {
    const loadedData = loadData()
    const user = loadedData.users[userId]
    
    if (!user) {
      throw new Error('用户不存在')
    }
    
    const isPasswordValid = await bcrypt.compare(oldPassword, user.passwordHash)
    
    if (!isPasswordValid) {
      throw new Error('原密码错误')
    }
    
    if (newPassword.length < 6) {
      throw new Error('新密码长度至少6位')
    }
    
    user.passwordHash = await bcrypt.hash(newPassword, this.saltRounds)
    user.updatedAt = new Date()
    loadedData.users[userId] = user
    saveData(loadedData)
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
      { userId: user.id, username: user.username },
      this.jwtSecret,
      { expiresIn: this.jwtExpiresIn as string }
    )
  }

  private toProfile(user: User): UserProfile {
    return {
      id: user.id,
      username: user.username,
      avatar: user.avatar,
      createdAt: user.createdAt
    }
  }
}

export const userService = new UserService()
