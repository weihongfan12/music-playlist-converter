import { Router, Request, Response } from 'express'
import { PlaylistParser } from '../services/parser'
import { PlaylistExporter } from '../services/exporter'
import { ApiResponse, PlaylistInfo, ExportFormat } from '../types'

const router = Router()
const parser = new PlaylistParser()
const exporter = new PlaylistExporter()

router.post('/parse', async (req: Request, res: Response) => {
  try {
    const { url, platform } = req.body

    if (!url || !platform) {
      return res.status(400).json({
        code: 1001,
        message: '请提供歌单链接和平台类型'
      } as ApiResponse)
    }

    const playlistInfo = await parser.parsePlaylist(url, platform)
    
    console.log(`[Parse] Playlist: ${playlistInfo.name}`)
    console.log(`[Parse] SongCount: ${playlistInfo.songCount}, Actual songs: ${playlistInfo.songs?.length || 0}`)
    
    res.json({
      code: 200,
      data: playlistInfo
    } as ApiResponse<PlaylistInfo>)
  } catch (error: any) {
    console.error('Parse playlist error:', error)
    res.status(500).json({
      code: 1003,
      message: error.message || '解析失败'
    } as ApiResponse)
  }
})

router.post('/export', async (req: Request, res: Response) => {
  try {
    const { songs, format } = req.body

    if (!songs || !format) {
      return res.status(400).json({
        code: 1001,
        message: '请提供歌曲列表和导出格式'
      } as ApiResponse)
    }

    const fileBuffer = await exporter.generateFile(songs, format as ExportFormat)
    
    const contentTypes: Record<string, string> = {
      json: 'application/json',
      csv: 'text/csv',
      m3u: 'audio/x-mpegurl'
    }

    res.setHeader('Content-Type', contentTypes[format] || 'application/octet-stream')
    res.setHeader('Content-Disposition', `attachment; filename="playlist.${format}"`)
    res.send(fileBuffer)
  } catch (error: any) {
    console.error('Export playlist error:', error)
    res.status(500).json({
      code: 5001,
      message: error.message || '导出失败'
    } as ApiResponse)
  }
})

router.post('/create', async (req: Request, res: Response) => {
  try {
    const { playlistName, platform, songUris } = req.body

    if (!playlistName || !platform || !songUris) {
      return res.status(400).json({
        code: 1001,
        message: '请提供歌单名称、平台和歌曲列表'
      } as ApiResponse)
    }

    const result = await exporter.createPlaylist(playlistName, platform, songUris)
    
    res.json({
      code: 200,
      data: result
    } as ApiResponse)
  } catch (error: any) {
    console.error('Create playlist error:', error)
    res.status(500).json({
      code: 5001,
      message: error.message || '创建歌单失败'
    } as ApiResponse)
  }
})

export default router
