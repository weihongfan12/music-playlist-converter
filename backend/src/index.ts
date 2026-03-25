import express, { Express, Request, Response } from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import path from 'path'
import axios from 'axios'
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

app.get('/api/v1/proxy/netease', async (req: Request, res: Response) => {
  try {
    const { endpoint, id, ids } = req.query
    const NETEASE_API = 'http://localhost:3200'
    
    let url = ''
    let params: any = {}
    
    if (endpoint === 'playlist/detail' && id) {
      url = `${NETEASE_API}/playlist/detail`
      params = { platform: 'netease', id }
    } else if (endpoint === 'song/detail' && ids) {
      url = `${NETEASE_API}/song/detail`
      params = { platform: 'netease', ids }
    } else {
      return res.status(400).json({ code: 400, message: 'Invalid endpoint or parameters' })
    }
    
    console.log(`[Proxy] Fetching: ${url}`, params)
    
    const response = await axios.get(url, { 
      params, 
      timeout: 60000
    })
    
    console.log(`[Proxy] Success: code=${response.data?.code}`)
    res.json(response.data)
  } catch (error: any) {
    console.error('[Proxy] Error:', error.message, error.code, error.response?.status)
    res.status(500).json({ 
      code: 500, 
      message: error.message || 'Proxy error',
      details: error.code
    })
  }
})

app.get('/api/v1/proxy/search', async (req: Request, res: Response) => {
  try {
    const { q, platform } = req.query
    
    if (!q) {
      return res.status(400).json({ code: 400, message: 'Missing query parameter' })
    }
    
    const searchPlatform = platform || 'qq'
    console.log(`[Search Proxy] Searching: ${q}, Platform: ${searchPlatform}`)
    
    const LOCAL_API = 'http://localhost:3200'
    
    const platformMap: Record<string, string> = {
      'netease': 'netease',
      'qq': 'qqmusic',
      'kugou': 'kugou',
      'kuwo': 'kuwo',
      'migu': 'migu'
    }
    
    const apiPlatform = platformMap[searchPlatform as string] || 'qqmusic'
    
    const response = await axios.get(`${LOCAL_API}/search`, {
      params: {
        platform: apiPlatform,
        keywords: q
      },
      timeout: 10000
    })
    
    const songs = response.data?.result?.songs || []
    
    const items = songs.slice(0, 5).map((song: any) => ({
      id: song.id?.toString() || song.mid || '',
      name: song.name || '',
      artist: (song.ar || []).map((a: any) => a.name || a),
      album: song.al?.name || '',
      duration: Math.floor((song.dt || 0) / 1000),
      cover: song.al?.picUrl || '',
      uri: `${searchPlatform}:${song.mid || song.id}`
    }))
    
    console.log(`[Search Proxy] Found ${items.length} results for: ${q}`)
    res.json({ code: 200, items })
  } catch (error: any) {
    console.error('[Search Proxy] Error:', error.message)
    res.json({ code: 200, items: [] })
  }
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
