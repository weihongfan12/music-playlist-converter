import { Router, Request, Response } from 'express'
import { userService } from '../services/userService'
import { authMiddleware, AuthRequest } from '../middleware/auth'
import { ApiResponse } from '../types'
import multer from 'multer'
import path from 'path'
import fs from 'fs'

const router = Router()

const uploadDir = path.join(__dirname, '../../uploads/avatars')
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true })
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir)
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
    const ext = path.extname(file.originalname)
    cb(null, 'avatar-' + uniqueSuffix + ext)
  }
})

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true)
    } else {
      cb(new Error('不支持的文件类型'))
    }
  }
})

router.post('/register', async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body

    if (!username || !password) {
      return res.status(400).json({
        code: 1001,
        message: '请提供用户名和密码'
      } as ApiResponse)
    }

    const result = await userService.register(username, password)
    
    res.json({
      code: 200,
      data: result
    } as ApiResponse)
  } catch (error: any) {
    console.error('Register error:', error)
    res.status(400).json({
      code: 1002,
      message: error.message || '注册失败'
    } as ApiResponse)
  }
})

router.post('/login', async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body

    if (!username || !password) {
      return res.status(400).json({
        code: 1001,
        message: '请提供用户名和密码'
      } as ApiResponse)
    }

    const result = await userService.login(username, password)
    
    res.json({
      code: 200,
      data: result
    } as ApiResponse)
  } catch (error: any) {
    console.error('Login error:', error)
    res.status(401).json({
      code: 1003,
      message: error.message || '登录失败'
    } as ApiResponse)
  }
})

router.get('/profile', authMiddleware, async (req: Request, res: Response) => {
  try {
    const authReq = req as AuthRequest
    const profile = await userService.getProfile(authReq.user!.userId)
    
    if (!profile) {
      return res.status(404).json({
        code: 1004,
        message: '用户不存在'
      } as ApiResponse)
    }
    
    res.json({
      code: 200,
      data: profile
    } as ApiResponse)
  } catch (error: any) {
    res.status(500).json({
      code: 5001,
      message: error.message || '获取用户信息失败'
    } as ApiResponse)
  }
})

router.put('/profile', authMiddleware, async (req: Request, res: Response) => {
  try {
    const authReq = req as AuthRequest
    const { username } = req.body
    
    const profile = await userService.updateProfile(authReq.user!.userId, { username })
    
    res.json({
      code: 200,
      data: profile
    } as ApiResponse)
  } catch (error: any) {
    res.status(400).json({
      code: 1005,
      message: error.message || '更新失败'
    } as ApiResponse)
  }
})

router.post('/avatar', authMiddleware, upload.single('avatar'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        code: 1001,
        message: '请上传头像文件'
      } as ApiResponse)
    }

    const authReq = req as AuthRequest
    const avatarUrl = `/uploads/avatars/${req.file.filename}`
    const profile = await userService.updateProfile(authReq.user!.userId, { avatar: avatarUrl })
    
    const fullAvatarUrl = `${req.protocol}://${req.get('host')}${avatarUrl}`
    
    res.json({
      code: 200,
      data: { avatar: fullAvatarUrl, profile }
    } as ApiResponse)
  } catch (error: any) {
    res.status(500).json({
      code: 5001,
      message: error.message || '上传头像失败'
    } as ApiResponse)
  }
})

router.put('/password', authMiddleware, async (req: Request, res: Response) => {
  try {
    const authReq = req as AuthRequest
    const { oldPassword, newPassword } = req.body
    
    if (!oldPassword || !newPassword) {
      return res.status(400).json({
        code: 1001,
        message: '请提供原密码和新密码'
      } as ApiResponse)
    }
    
    await userService.changePassword(authReq.user!.userId, oldPassword, newPassword)
    
    res.json({
      code: 200,
      message: '密码修改成功'
    } as ApiResponse)
  } catch (error: any) {
    res.status(400).json({
      code: 1006,
      message: error.message || '修改密码失败'
    } as ApiResponse)
  }
})

export default router
