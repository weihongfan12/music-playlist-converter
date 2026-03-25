import { defineStore } from 'pinia'
import { ref } from 'vue'
import axios from 'axios'

interface Song {
  id: string
  name: string
  artist: string[]
  album?: string
  duration?: number
  cover?: string
}

interface MatchResult {
  sourceSong: Song
  matchedSong: Song | null
  confidence: number
  matchType: 'exact' | 'fuzzy' | 'manual' | 'unmatched'
}

interface PlaylistInfo {
  id: string
  name: string
  creator: string
  description: string
  songCount: number
  createTime: string
  songs: Song[]
}

interface MatchResponse {
  total: number
  matched: number
  unmatched: number
  results: MatchResult[]
}

const NETEASE_API_BASE = '/api/v1/proxy/netease'

async function fetchNeteaseSongs(trackIds: number[]): Promise<Song[]> {
  const songs: Song[] = []
  const batchSize = 100

  for (let i = 0; i < trackIds.length; i += batchSize) {
    const batchIds = trackIds.slice(i, i + batchSize)

    try {
      const response = await axios.get(NETEASE_API_BASE, {
        params: { 
          endpoint: 'song/detail',
          ids: batchIds.join(',')
        },
        timeout: 30000
      })

      if (response.data.code === 200 && response.data.songs) {
        const batchSongs = response.data.songs.map((track: any) => ({
          id: track.id.toString(),
          name: track.name,
          artist: (track.ar || []).map((a: any) => a.name),
          album: track.al?.name || '',
          duration: Math.floor((track.dt || 0) / 1000),
          cover: track.al?.picUrl
        }))

        songs.push(...batchSongs)
        console.log(`[前端] 获取批次 ${Math.floor(i / batchSize) + 1}: +${batchSongs.length} 首 (总计: ${songs.length})`)
      }
    } catch (error: any) {
      console.error(`[前端] 批次 ${Math.floor(i / batchSize) + 1} 失败: ${error.message}`)
    }

    if (i + batchSize < trackIds.length) {
      await new Promise(resolve => setTimeout(resolve, 100))
    }
  }

  return songs
}

async function parseNeteasePlaylistDirectly(playlistId: string): Promise<PlaylistInfo> {
  console.log(`[前端直接解析] 网易云歌单 ${playlistId}`)

  try {
    const response = await axios.get(NETEASE_API_BASE, {
      params: { 
        endpoint: 'playlist/detail',
        id: playlistId
      },
      timeout: 30000
    })

    const data = response.data

    if (data.code !== 200 || !data.playlist) {
      throw new Error(`API返回错误: code=${data.code}`)
    }

    const playlist = data.playlist
    const trackIds = playlist.trackIds?.map((t: any) => t.id) || []

    console.log(`[前端直接解析] 找到 ${trackIds.length} 首歌曲`)

    const songs = await fetchNeteaseSongs(trackIds)

    return {
      id: playlist.id.toString(),
      name: playlist.name,
      creator: playlist.creator?.nickname || '未知',
      description: playlist.description || '',
      songCount: songs.length,
      createTime: new Date(playlist.createTime || Date.now()).toISOString(),
      songs
    }
  } catch (error: any) {
    console.error('[前端直接解析] 错误:', error)
    if (error.code === 'ERR_NETWORK' || error.message?.includes('CORS') || error.message?.includes('Network Error')) {
      throw new Error('网络访问受限，请检查网络连接或尝试使用其他平台')
    }
    throw error
  }
}

function extractPlaylistId(url: string, platform: string): string | null {
  const patterns: Record<string, RegExp[]> = {
    netease: [/playlist\?id=(\d+)/, /playlist\/(\d+)/],
    qq: [/playlist\/(\d+)/, /id=(\d+)/, /special\/(\d+)/],
    kugou: [/special\/(\d+)/, /id=(\d+)/],
    kuwo: [/playlist_detail\/(\d+)/, /pid=(\d+)/],
    migu: [/playlist\/(\d+)/, /id=(\d+)/]
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

export const usePlaylistStore = defineStore('playlist', () => {
  const playlistInfo = ref<PlaylistInfo | null>(null)
  const matchResults = ref<MatchResponse | null>(null)
  const targetPlatform = ref<string>('')

  function setPlaylistInfo(info: PlaylistInfo) {
    playlistInfo.value = info
  }

  function setMatchResults(results: MatchResponse) {
    matchResults.value = results
  }

  function setTargetPlatform(platform: string) {
    targetPlatform.value = platform
  }

  async function parsePlaylist(url: string, platform: string) {
    if (platform === 'netease') {
      const playlistId = extractPlaylistId(url, platform)
      if (!playlistId) {
        throw new Error('无效的歌单链接')
      }
      const info = await parseNeteasePlaylistDirectly(playlistId)
      setPlaylistInfo(info)
      return info
    }

    const response = await axios.post('/api/v1/playlist/parse', {
      url,
      platform
    })

    if (response.data.code === 200) {
      setPlaylistInfo(response.data.data)
      return response.data.data
    }

    throw new Error(response.data.message || '解析失败')
  }

  async function matchSongs(songs: any[], targetPlatform: string) {
    const response = await axios.post('/api/v1/songs/match', {
      songs,
      targetPlatform,
      matchStrategy: 'auto'
    })

    if (response.data.code === 200) {
      setMatchResults(response.data.data)
      setTargetPlatform(targetPlatform)
      return response.data.data
    }

    throw new Error(response.data.message || '匹配失败')
  }

  function clearAll() {
    playlistInfo.value = null
    matchResults.value = null
    targetPlatform.value = ''
  }

  return {
    playlistInfo,
    matchResults,
    targetPlatform,
    setPlaylistInfo,
    setMatchResults,
    setTargetPlatform,
    parsePlaylist,
    matchSongs,
    clearAll
  }
})
