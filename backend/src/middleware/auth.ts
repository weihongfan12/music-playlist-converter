import { Request, Response, NextFunction } from 'express'
import { userService } from '../services/userService'
import { JWTPayload } from '../types/user'

declare global {
  namespace Express {
    interface Request {
      user?: JWTPayload
    }
  }
}

export interface AuthRequest extends Request {
  user?: JWTPayload
}

export function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      code: 3001,
      message: '请先登录'
    })
  }

  const token = authHeader.substring(7)
  
  try {
    const payload = userService.verifyToken(token)
    req.user = payload
    next()
  } catch (error) {
    return res.status(401).json({
      code: 3002,
      message: '登录已过期，请重新登录'
    })
  }
}

export function optionalAuth(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization
  
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7)
    
    try {
      const payload = userService.verifyToken(token)
      req.user = payload
    } catch {
      // Token invalid, but continue without user
    }
  }
  
  next()
}
