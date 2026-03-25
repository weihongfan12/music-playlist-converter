import axios from 'axios'
import { Song, MatchResult, ExportFormat, ExportResult, Platform } from '../types'

export class PlaylistExporter {
  private youtubeApiKey: string = process.env.YOUTUBE_API_KEY || ''

  async generateFile(songs: MatchResult[], format: ExportFormat): Promise<Buffer> {
    switch (format) {
      case 'json':
        return this.generateJson(songs)
      case 'csv':
        return this.generateCsv(songs)
      case 'm3u':
        return this.generateM3u(songs)
      case 'txt':
        return this.generateTxt(songs)
      default:
        throw new Error('不支持的导出格式')
    }
  }

  private generateJson(songs: MatchResult[]): Buffer {
    const data = songs.map(result => ({
      source: {
        name: result.sourceSong.name,
        artist: result.sourceSong.artist,
        album: result.sourceSong.album
      },
      matched: result.matchedSong ? {
        name: result.matchedSong.name,
        artist: result.matchedSong.artist,
        album: result.matchedSong.album,
        uri: result.matchedSong.uri
      } : null,
      confidence: result.confidence,
      matchType: result.matchType
    }))

    return Buffer.from(JSON.stringify(data, null, 2), 'utf-8')
  }

  private generateCsv(songs: MatchResult[]): Buffer {
    const headers = [
      '原歌曲名',
      '原歌手',
      '原专辑',
      '匹配歌曲名',
      '匹配歌手',
      '匹配专辑',
      '匹配度',
      '匹配状态'
    ]

    const rows = songs.map(result => [
      this.escapeCsvField(result.sourceSong.name),
      this.escapeCsvField(result.sourceSong.artist.join('; ')),
      this.escapeCsvField(result.sourceSong.album),
      result.matchedSong ? this.escapeCsvField(result.matchedSong.name) : '',
      result.matchedSong ? this.escapeCsvField(result.matchedSong.artist.join('; ')) : '',
      result.matchedSong ? this.escapeCsvField(result.matchedSong.album) : '',
      result.confidence ? (result.confidence * 100).toFixed(1) + '%' : '0%',
      this.getMatchTypeText(result.matchType)
    ])

    const csv = [headers.join(','), ...rows.map(row => row.join(','))].join('\n')
    
    return Buffer.from('\ufeff' + csv, 'utf-8')
  }

  private generateM3u(songs: MatchResult[]): Buffer {
    const lines = ['#EXTM3U']
    
    for (const result of songs) {
      if (result.matchedSong) {
        const duration = result.matchedSong.duration || -1
        const artist = result.matchedSong.artist.join(', ')
        const title = result.matchedSong.name
        
        lines.push(`#EXTINF:${duration},${artist} - ${title}`)
        
        if (result.matchedSong.uri) {
          lines.push(result.matchedSong.uri)
        }
      }
    }

    return Buffer.from(lines.join('\n'), 'utf-8')
  }

  private generateTxt(songs: MatchResult[]): Buffer {
    const lines: string[] = []
    lines.push('========== 歌单导出列表 ==========')
    lines.push('')
    
    let index = 1
    for (const result of songs) {
      const song = result.sourceSong
      const artist = song.artist.join(', ') || '未知'
      const album = song.album || '未知专辑'
      
      lines.push(`${index}. ${song.name}`)
      lines.push(`   歌手: ${artist}`)
      lines.push(`   专辑: ${album}`)
      
      if (result.matchedSong) {
        lines.push(`   匹配: ${result.matchedSong.name} - ${result.matchedSong.artist?.join(', ')}`)
        if (result.matchedSong.uri) {
          const videoId = result.matchedSong.uri.replace('youtube:music:', '')
          lines.push(`   链接: https://music.youtube.com/watch?v=${videoId}`)
        }
      } else {
        lines.push(`   状态: 未匹配`)
        const query = encodeURIComponent(`${song.name} ${artist}`)
        lines.push(`   搜索: https://open.spotify.com/search/${query}`)
      }
      
      lines.push('')
      index++
    }
    
    lines.push('========================================')
    lines.push(`总计: ${songs.length} 首歌曲`)
    lines.push(`匹配成功: ${songs.filter(s => s.matchedSong).length} 首`)
    lines.push(`未匹配: ${songs.filter(s => !s.matchedSong).length} 首`)

    return Buffer.from(lines.join('\n'), 'utf-8')
  }

  private escapeCsvField(field: string): string {
    if (field.includes(',') || field.includes('"') || field.includes('\n')) {
      return `"${field.replace(/"/g, '""')}"`
    }
    return field
  }

  private getMatchTypeText(type: string): string {
    const texts: Record<string, string> = {
      exact: '精确匹配',
      fuzzy: '模糊匹配',
      manual: '手动匹配',
      unmatched: '未匹配'
    }
    return texts[type] || type
  }

  async createPlaylist(
    playlistName: string,
    platform: Platform,
    songUris: string[]
  ): Promise<ExportResult> {
    switch (platform) {
      case 'spotify':
        return this.createSpotifyPlaylist(playlistName, songUris)
      case 'youtube_music':
        return this.createYouTubeMusicPlaylist(playlistName, songUris)
      default:
        throw new Error('不支持的目标平台')
    }
  }

  private async createSpotifyPlaylist(
    playlistName: string,
    songUris: string[]
  ): Promise<ExportResult> {
    return {
      success: false,
      unmatchedCount: songUris.length,
      errors: ['Spotify API 需要 Premium 会员才能使用']
    }
  }

  private async createYouTubeMusicPlaylist(
    playlistName: string,
    songUris: string[]
  ): Promise<ExportResult> {
    const videoIds = songUris
      .filter(uri => uri && uri.includes('youtube'))
      .map(uri => {
        const match = uri.match(/youtube:music:([a-zA-Z0-9_-]+)/)
        return match ? match[1] : null
      })
      .filter(id => id !== null)

    if (videoIds.length === 0) {
      return {
        success: false,
        unmatchedCount: songUris.length,
        errors: ['没有有效的 YouTube 视频 ID']
      }
    }

    const youtubeLinks = videoIds.map(id => `https://music.youtube.com/watch?v=${id}`)
    
    return {
      success: true,
      playlistId: 'youtube_playlist_' + Date.now(),
      playlistUrl: youtubeLinks[0],
      unmatchedCount: songUris.length - videoIds.length,
      errors: ['YouTube Music 歌单创建需要用户 OAuth 授权。已为您生成第一个视频链接，请查看导出文件获取完整列表。']
    }
  }

  generateYouTubeMusicLinks(songUris: string[]): string[] {
    return songUris
      .filter(uri => uri && uri.includes('youtube'))
      .map(uri => {
        const match = uri.match(/youtube:music:([a-zA-Z0-9_-]+)/)
        if (match) {
          return `https://music.youtube.com/watch?v=${match[1]}`
        }
        return null
      })
      .filter(url => url !== null) as string[]
  }
}
