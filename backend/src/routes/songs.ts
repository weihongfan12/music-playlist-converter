import { Router, Request, Response } from 'express'
import { SongMatcher } from '../services/matcher'
import { ApiResponse, MatchResponse, Platform, Song } from '../types'

const router = Router()
const matcher = new SongMatcher()

router.post('/match', async (req: Request, res: Response) => {
  try {
    const { songs, targetPlatform, matchStrategy } = req.body

    console.log(`[Match] Received songs: ${songs?.length || 0}`)
    console.log(`[Match] Target platform: ${targetPlatform}`)

    if (!songs || !targetPlatform) {
      return res.status(400).json({
        code: 1001,
        message: '请提供歌曲列表和目标平台'
      } as ApiResponse)
    }

    const results = await matcher.batchMatch(songs as Song[], targetPlatform as Platform)
    
    console.log(`[Match] Results count: ${results.length}`)
    
    const matched = results.filter(r => r.matchType !== 'unmatched').length
    const unmatched = results.length - matched

    res.json({
      code: 200,
      data: {
        total: results.length,
        matched,
        unmatched,
        results
      } as MatchResponse
    } as ApiResponse<MatchResponse>)
  } catch (error: any) {
    console.error('Match songs error:', error)
    res.status(500).json({
      code: 5001,
      message: error.message || '匹配失败'
    } as ApiResponse)
  }
})

export default router
