import { Song, MatchResult, ExportFormat, ExportResult, Platform } from '../types'

export class PlaylistExporter {
  async generateFile(songs: MatchResult[], format: ExportFormat): Promise<Buffer> {
    switch (format) {
      case 'json':
        return this.generateJson(songs)
      case 'csv':
        return this.generateCsv(songs)
      case 'm3u':
        return this.generateM3u(songs)
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
      case 'apple_music':
        return this.createAppleMusicPlaylist(playlistName, songUris)
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
      success: true,
      playlistId: 'mock_spotify_playlist_id',
      playlistUrl: 'https://open.spotify.com/playlist/mock_spotify_playlist_id',
      unmatchedCount: 0,
      errors: []
    }
  }

  private async createAppleMusicPlaylist(
    playlistName: string,
    songUris: string[]
  ): Promise<ExportResult> {
    return {
      success: true,
      playlistId: 'mock_apple_playlist_id',
      playlistUrl: 'https://music.apple.com/playlist/mock_apple_playlist_id',
      unmatchedCount: 0,
      errors: []
    }
  }

  private async createYouTubeMusicPlaylist(
    playlistName: string,
    songUris: string[]
  ): Promise<ExportResult> {
    return {
      success: true,
      playlistId: 'mock_youtube_playlist_id',
      playlistUrl: 'https://music.youtube.com/playlist?list=mock_youtube_playlist_id',
      unmatchedCount: 0,
      errors: []
    }
  }
}
