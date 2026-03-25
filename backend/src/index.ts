import express, { Express, Request, Response } from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import path from 'path'
import playlistRoutes from './routes/playlist'
import songRoutes from './routes/songs'
import authRoutes from './routes/auth'

dotenv.config()

const app: Express = express()
const PORT = process.env.PORT || 3001

app.use(cors())
app.use(express.json())
app.use('/uploads', express.static(path.join(__dirname, '../uploads')))

app.get('/api/v1/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

app.use('/api/v1/playlist', playlistRoutes)
app.use('/api/v1/songs', songRoutes)
app.use('/api/v1/auth', authRoutes)

app.use((err: Error, req: Request, res: Response, next: any) => {
  console.error(err.stack)
  res.status(500).json({
    code: 5001,
    message: '服务器内部错误',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  })
})

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`)
})

export default app
