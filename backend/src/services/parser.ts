import axios from 'axios'
import { PlaylistInfo, Song, Platform } from '../types'

interface APIConfig {
  name: string
  baseUrl: string
  useProxy?: boolean
  endpoints: {
    playlistDetail: string
    songDetail: string
    search: string
  }
}

const API_CONFIGS: Record<Platform, APIConfig[]> = {
  netease: [
    {
      name: '网易云音乐 (主-通过前端代理)',
      baseUrl: '/netease-api',
      useProxy: true,
      endpoints: {
        playlistDetail: '/playlist/detail',
        songDetail: '/song/detail',
        search: '/search'
      }
    },
    {
      name: '网易云音乐 (备用1)',
      baseUrl: 'https://netease-cloud-music-api-cyan.vercel.app',
      useProxy: false,
      endpoints: {
        playlistDetail: '/playlist/detail',
        songDetail: '/song/detail',
        search: '/search'
      }
    },
    {
      name: '网易云音乐 (备用2)',
      baseUrl: 'https://api.injahow.cn/meting',
      useProxy: false,
      endpoints: {
        playlistDetail: '/playlist/detail',
        songDetail: '/song/detail',
        search: '/search'
      }
    }
  ],
  qq: [
    {
      name: 'QQ音乐 (主)',
      baseUrl: 'https://api.qq.jsososo.com',
      useProxy: false,
      endpoints: {
        playlistDetail: '/playlist/detail',
        songDetail: '/song/detail',
        search: '/search'
      }
    }
  ],
  kugou: [
    {
      name: '酷狗音乐 (主)',
      baseUrl: 'https://api.kugou.com',
      useProxy: false,
      endpoints: {
        playlistDetail: '/api/v3/special/detail',
        songDetail: '/api/v3/song/detail',
        search: '/api/v3/search/song'
      }
    }
  ],
  kuwo: [
    {
      name: '酷我音乐 (主)',
      baseUrl: 'https://api.kuwo.cn',
      useProxy: false,
      endpoints: {
        playlistDetail: '/api/www/playlist/playlistDetail',
        songDetail: '/api/www/player/url',
        search: '/api/www/search/searchMusicBykeyWord'
      }
    }
  ],
  migu: [
    {
      name: '咪咕音乐 (主)',
      baseUrl: 'https://api.migu.jsososo.com',
      useProxy: false,
      endpoints: {
        playlistDetail: '/api/v1/playlist/detail',
        songDetail: '/api/v1/song/detail',
        search: '/api/v1/search/search'
      }
    }
  ],
  spotify: [],
  apple_music: [],
  youtube_music: []
}

export class PlaylistParser {
  async parsePlaylist(url: string, platform: Platform): Promise<PlaylistInfo> {
    const playlistId = this.extractPlaylistId(url, platform)
    
    if (!playlistId) {
      throw new Error('无效的歌单链接')
    }

    switch (platform) {
      case 'netease':
        return this.parseNeteasePlaylist(playlistId)
      case 'qq':
        return this.parseQQPlaylist(playlistId)
      case 'kugou':
        return this.parseKugouPlaylist(playlistId)
      case 'kuwo':
        return this.parseKuwoPlaylist(playlistId)
      case 'migu':
        return this.parseMiguPlaylist(playlistId)
      default:
        throw new Error('不支持的平台')
    }
  }

  private extractPlaylistId(url: string, platform: Platform): string | null {
    const patterns: Record<Platform, RegExp[]> = {
      netease: [/playlist\?id=(\d+)/, /playlist\/(\d+)/],
      qq: [/playlist\/(\d+)/, /id=(\d+)/, /special\/(\d+)/],
      kugou: [/special\/(\d+)/, /id=(\d+)/],
      kuwo: [/playlist_detail\/(\d+)/, /pid=(\d+)/],
      migu: [/playlist\/(\d+)/, /id=(\d+)/],
      spotify: [/playlist\/([a-zA-Z0-9]+)/],
      apple_music: [/playlist\/([a-zA-Z0-9-]+)/],
      youtube_music: [/playlist\?list=([a-zA-Z0-9_-]+)/]
    }

    const regexes = patterns[platform] || []
    for (const regex of regexes) {
      const match = url.match(regex)
      if (match) {
        return match[1] || null
      }
    }
    return null
  }

  private async tryAPIs<T>(
    platform: Platform,
    apiCall: (config: APIConfig) => Promise<T>,
    fallbackMessage: string
  ): Promise<T> {
    const configs = API_CONFIGS[platform]
    
    if (!configs || configs.length === 0) {
      throw new Error(fallbackMessage)
    }

    const errors: string[] = []

    for (let i = 0; i < configs.length; i++) {
      const config = configs[i]
      try {
        console.log(`[${config.name}] 尝试连接...`)
        const result = await apiCall(config)
        console.log(`[${config.name}] ✅ 成功!`)
        return result
      } catch (error: any) {
        console.log(`[${config.name}] ❌ 失败: ${error.message}`)
        errors.push(`${config.name}: ${error.message}`)
      }
    }

    throw new Error(`所有API都失败了:\n${errors.join('\n')}`)
  }

  private async parseNeteasePlaylist(playlistId: string): Promise<PlaylistInfo> {
    console.log(`[网易云] 开始解析歌单 ${playlistId}`)

    return this.tryAPIs(
      'netease',
      async (config) => {
        const url = `${config.baseUrl}${config.endpoints.playlistDetail}`

        const response = await axios.get(url, {
          params: { id: playlistId },
          timeout: 30000,
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
          }
        })

        const data = response.data

        if (data.code !== 200 || !data.playlist) {
          throw new Error(`API返回错误: code=${data.code}`)
        }

        const playlist = data.playlist
        const trackIds = playlist.trackIds?.map((t: any) => t.id) || []

        console.log(`[网易云] 找到 ${trackIds.length} 首歌曲`)

        const songs = await this.fetchNeteaseSongs(trackIds, config)

        return {
          id: playlist.id.toString(),
          name: playlist.name,
          creator: playlist.creator?.nickname || '未知',
          description: playlist.description || '',
          songCount: songs.length,
          createTime: new Date(playlist.createTime || Date.now()),
          songs
        }
      },
      '网易云音乐API暂不可用'
    )
  }

  private async fetchNeteaseSongs(trackIds: number[], config: APIConfig): Promise<Song[]> {
    const songs: Song[] = []
    const batchSize = 100

    for (let i = 0; i < trackIds.length; i += batchSize) {
      const batchIds = trackIds.slice(i, i + batchSize)

      try {
        const url = `${config.baseUrl}${config.endpoints.songDetail}`
        const detailResponse = await axios.get(url, {
          params: { ids: batchIds.join(',') },
          timeout: 30000,
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
          }
        })

        if (detailResponse.data.code === 200 && detailResponse.data.songs) {
          const batchSongs = detailResponse.data.songs.map((track: any) => ({
            id: track.id.toString(),
            name: track.name,
            artist: (track.ar || []).map((a: any) => a.name),
            album: track.al?.name || '',
            duration: Math.floor((track.dt || 0) / 1000),
            cover: track.al?.picUrl
          }))

          songs.push(...batchSongs)
          console.log(`[网易云] 获取批次 ${Math.floor(i / batchSize) + 1}: +${batchSongs.length} 首 (总计: ${songs.length})`)
        }
      } catch (error: any) {
        console.error(`[网易云] 批次 ${Math.floor(i / batchSize) + 1} 失败: ${error.message}`)
      }

      if (i + batchSize < trackIds.length) {
        await new Promise(resolve => setTimeout(resolve, 100))
      }
    }

    return songs
  }

  private async parseQQPlaylist(playlistId: string): Promise<PlaylistInfo> {
    return this.tryAPIs(
      'qq',
      async (config) => {
        const response = await axios.get(`${config.baseUrl}${config.endpoints.playlistDetail}`, {
          params: { id: playlistId },
          timeout: 30000
        })

        const data = response.data

        if (data.code !== 200 || !data.cdlist?.[0]) {
          throw new Error(`API返回错误`)
        }

        const playlist = data.cdlist[0]
        const songs = (playlist.trackids || []).map((item: any, index: number) => ({
          id: item.songmid || item.id?.toString() || `qq-${index}`,
          name: item.songname || item.name || '未知',
          artist: (item.singer || []).map((s: any) => s.name),
          album: item.albumname || '',
          duration: Math.floor((item.interval || 0)),
          cover: `https://y.gtimg.cn/music/photo_new/T002R300x300M000${item.albummid || ''}.jpg`
        }))

        return {
          id: playlist.dissid || playlistId,
          name: playlist.dissname || playlist.title || '未知',
          creator: playlist.nickname || playlist.creator?.name || '未知',
          description: playlist.desc || '',
          songCount: songs.length,
          createTime: new Date(),
          songs
        }
      },
      'QQ音乐API暂不可用'
    )
  }

  private async parseKugouPlaylist(playlistId: string): Promise<PlaylistInfo> {
    return this.tryAPIs(
      'kugou',
      async (config) => {
        const response = await axios.get(`${config.baseUrl}${config.endpoints.playlistDetail}`, {
          params: { specialid: playlistId },
          timeout: 30000
        })

        const data = response.data

        if (data.errcode !== 0 || !data.data) {
          throw new Error(`API返回错误`)
        }

        const playlist = data.data
        const songs = (playlist.lists || []).map((item: any) => ({
          id: item.hash || item.id?.toString() || '',
          name: item.filename || item.songname || '未知',
          artist: (item.artist_name || item.singers || '').split('、'),
          album: item.album_name || '',
          duration: Math.floor((item.duration || 0)),
          cover: item.img || ''
        }))

        return {
          id: playlist.specialid || playlistId,
          name: playlist.specialname || playlist.title || '未知',
          creator: playlist.nickname || '未知',
          description: playlist.intro || '',
          songCount: songs.length,
          createTime: new Date(),
          songs
        }
      },
      '酷狗音乐API暂不可用'
    )
  }

  private async parseKuwoPlaylist(playlistId: string): Promise<PlaylistInfo> {
    return this.tryAPIs(
      'kuwo',
      async (config) => {
        const response = await axios.get(`${config.baseUrl}${config.endpoints.playlistDetail}`, {
          params: { pid: playlistId, start: 0, count: 500 },
          timeout: 30000
        })

        const data = response.data

        if (data.code !== 200 || !data.data) {
          throw new Error(`API返回错误`)
        }

        const playlist = data.data
        const songs = (playlist.musicList || []).map((item: any) => ({
          id: item.rid || item.id?.toString() || '',
          name: item.name || '未知',
          artist: (item.artist || '').split(','),
          album: item.album || item.album_name || '',
          duration: Math.floor((item.duration || 0)),
          cover: item.pic || item.albumpic || ''
        }))

        return {
          id: playlist.id || playlistId,
          name: playlist.name || '未知',
          creator: playlist.uname || playlist.creator?.name || '未知',
          description: playlist.desc || '',
          songCount: songs.length,
          createTime: new Date(),
          songs
        }
      },
      '酷我音乐API暂不可用'
    )
  }

  private async parseMiguPlaylist(playlistId: string): Promise<PlaylistInfo> {
    return this.tryAPIs(
      'migu',
      async (config) => {
        const response = await axios.get(`${config.baseUrl}${config.endpoints.playlistDetail}`, {
          params: { id: playlistId },
          timeout: 30000
        })

        const data = response.data

        if (data.code !== 200 || !data.data) {
          throw new Error(`API返回错误`)
        }

        const playlist = data.data
        const songs = (playlist.songs || []).map((item: any) => ({
          id: item.id || item.copyrightId || '',
          name: item.name || '未知',
          artist: (item.singers || []).map((s: any) => s.name),
          album: item.album?.name || '',
          duration: Math.floor((item.duration || 0)),
          cover: item.album?.pic || ''
        }))

        return {
          id: playlist.id || playlistId,
          name: playlist.name || '未知',
          creator: playlist.creator?.name || '未知',
          description: playlist.description || '',
          songCount: songs.length,
          createTime: new Date(),
          songs
        }
      },
      '咪咕音乐API暂不可用'
    )
  }
}

export const parser = new PlaylistParser()
