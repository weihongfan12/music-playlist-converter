import { Router, Request, Response } from 'express'
import { userService } from '../services/userService'
import { authMiddleware } from '../middleware/auth'
import { ApiResponse, UserProfile } from '../types'
import multer from 'multer'
import path from 'path'
import { v4 as uuidv4 } from 'uuid'

const router = Router()

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/avatars/')
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname)
    cb(null, `${uuidv4()}${ext}`)
  }
})

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif']
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true)
    } else {
      cb(new Error('不支持的文件类型'))
    }
  }
})

router.post('/register', async (req: Request, res: Response) => {
  try {
    const { username, email, password } = req.body

    if (!username || !email || !password) {
      return res.status(400).json({
        code: 1001,
        message: '请填写完整的注册信息'
      } as ApiResponse)
    }

    if (password.length < 6) {
      return res.status(400).json({
        code: 1001,
        message: '密码长度至少6位'
      } as ApiResponse)
    }

    const result = await userService.register({ username, email, password })
    
    res.json({
      code: 200,
      data: result
    } as ApiResponse)
  } catch (error: any) {
    res.status(400).json({
      code: 1001,
      message: error.message || '注册失败'
    } as ApiResponse)
  }
})

router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body

    if (!email || !password) {
      return res.status(400).json({
        code: 1001,
        message: '请输入邮箱和密码'
      } as ApiResponse)
    }

    const result = await userService.login({ email, password })
    
    res.json({
      code: 200,
      data: result
    } as ApiResponse)
  } catch (error: any) {
    res.status(401).json({
      code: 1001,
      message: error.message || '登录失败'
    } as ApiResponse)
  }
})

router.get('/profile', authMiddleware, async (req: Request, res: Response) => {
  try {
    const profile = await userService.getProfile(req.user!.userId)
    
    if (!profile) {
      return res.status(404).json({
        code: 1002,
        message: '用户不存在'
      } as ApiResponse)
    }

    res.json({
      code: 200,
      data: profile
    } as ApiResponse<UserProfile>)
  } catch (error: any) {
    res.status(500).json({
      code: 5001,
      message: error.message || '获取用户信息失败'
    } as ApiResponse)
  }
})

router.put('/profile', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { username } = req.body
    const profile = await userService.updateProfile(req.user!.userId, { username })
    
    res.json({
      code: 200,
      data: profile
    } as ApiResponse<UserProfile>)
  } catch (error: any) {
    res.status(400).json({
      code: 1001,
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

    const avatarUrl = `/uploads/avatars/${req.file.filename}`
    const profile = await userService.updateProfile(req.user!.userId, { avatar: avatarUrl })
    
    res.json({
      code: 200,
      data: { avatar: avatarUrl, profile }
    } as ApiResponse)
  } catch (error: any) {
    res.status(500).json({
      code: 5001,
      message: error.message || '上传头像失败'
    } as ApiResponse)
  }
})

router.post('/change-password', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { oldPassword, newPassword } = req.body

    if (!oldPassword || !newPassword) {
      return res.status(400).json({
        code: 1001,
        message: '请输入原密码和新密码'
      } as ApiResponse)
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        code: 1001,
        message: '新密码长度至少6位'
      } as ApiResponse)
    }

    await userService.changePassword(req.user!.userId, oldPassword, newPassword)
    
    res.json({
      code: 200,
      message: '密码修改成功'
    } as ApiResponse)
  } catch (error: any) {
    res.status(400).json({
      code: 1001,
      message: error.message || '修改密码失败'
    } as ApiResponse)
  }
})

router.post('/forgot-password', async (req: Request, res: Response) => {
  try {
    const { email } = req.body

    if (!email) {
      return res.status(400).json({
        code: 1001,
        message: '请输入邮箱'
      } as ApiResponse)
    }

    await userService.forgotPassword(email)
    
    res.json({
      code: 200,
      message: '如果该邮箱已注册，您将收到重置密码的邮件'
    } as ApiResponse)
  } catch (error: any) {
    res.status(500).json({
      code: 5001,
      message: error.message || '发送邮件失败'
    } as ApiResponse)
  }
})

router.post('/reset-password', async (req: Request, res: Response) => {
  try {
    const { token, newPassword } = req.body

    if (!token || !newPassword) {
      return res.status(400).json({
        code: 1001,
        message: '参数不完整'
      } as ApiResponse)
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        code: 1001,
        message: '密码长度至少6位'
      } as ApiResponse)
    }

    await userService.resetPassword(token, newPassword)
    
    res.json({
      code: 200,
      message: '密码重置成功'
    } as ApiResponse)
  } catch (error: any) {
    res.status(400).json({
      code: 1001,
      message: error.message || '重置密码失败'
    } as ApiResponse)
  }
})

export default router
