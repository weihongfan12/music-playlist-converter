import axios from 'axios'
import { v4 as uuidv4 } from 'uuid'
import { PlaylistInfo, Song, Platform } from '../types'

export class PlaylistParser {
  private readonly neteaseApiUrl = process.env.NETEASE_API_URL || 'https://api-enhanced-kappa-vert.vercel.app'

  async parsePlaylist(url: string, platform: Platform): Promise<PlaylistInfo> {
    const playlistId = this.extractPlaylistId(url, platform)
    
    if (!playlistId) {
      throw new Error('无效的歌单链接')
    }

    switch (platform) {
      case 'netease':
        return this.parseNeteasePlaylist(playlistId)
      case 'qq':
        return this.parseQQPlaylist(playlistId, url)
      case 'kugou':
        return this.parseKugouPlaylist(playlistId, url)
      case 'kuwo':
        return this.parseKuwoPlaylist(playlistId, url)
      case 'migu':
        return this.parseMiguPlaylist(playlistId, url)
      default:
        throw new Error('不支持的平台')
    }
  }

  private extractPlaylistId(url: string, platform: Platform): string | null {
    const patterns: Record<Platform, RegExp> = {
      netease: /playlist\?id=(\d+)/,
      qq: /playlist\/(\d+)|id=(\d+)/,
      kugou: /special\/(\d+)|id=(\d+)/,
      kuwo: /playlist_detail\/(\d+)|pid=(\d+)/,
      migu: /playlist\/(\d+)|id=(\d+)/,
      spotify: /playlist\/([a-zA-Z0-9]+)/,
      apple_music: /playlist\/([a-zA-Z0-9-]+)/,
      youtube_music: /playlist\?list=([a-zA-Z0-9_-]+)/
    }

    const match = url.match(patterns[platform])
    if (match) {
      return match[1] || match[2] || null
    }
    return null
  }

  private async parseNeteasePlaylist(playlistId: string): Promise<PlaylistInfo> {
    try {
      console.log(`[Netease] Fetching playlist ${playlistId}`)
      
      const response = await axios.get(`${this.neteaseApiUrl}/playlist/detail`, {
        params: { id: playlistId },
        timeout: 15000
      })

      const data = response.data
      
      if (data.code !== 200 || !data.playlist) {
        throw new Error('歌单不存在或已失效')
      }

      const playlist = data.playlist
      const trackIds = playlist.trackIds?.map((t: any) => t.id) || []
      
      console.log(`[Netease] Found ${trackIds.length} track IDs`)
      
      let songs: Song[] = []
      
      if (trackIds.length > 0) {
        const batchSize = 100
        let successCount = 0
        let failCount = 0
        
        for (let i = 0; i < trackIds.length; i += batchSize) {
          const batchIds = trackIds.slice(i, i + batchSize)
          try {
            console.log(`[Netease] Fetching batch ${Math.floor(i/batchSize) + 1}, songs ${i+1}-${Math.min(i+batchSize, trackIds.length)}`)
            
            const detailResponse = await axios.get(`${this.neteaseApiUrl}/song/detail`, {
              params: { ids: batchIds.join(',') },
              timeout: 30000
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
              songs = songs.concat(batchSongs)
              successCount += batchSongs.length
              console.log(`[Netease] Batch success: ${batchSongs.length} songs, total: ${songs.length}`)
            } else {
              failCount += batchIds.length
              console.error(`[Netease] Batch failed: code=${detailResponse.data.code}, songs=${detailResponse.data.songs?.length || 0}`)
            }
          } catch (e: any) {
            failCount += batchIds.length
            console.error(`[Netease] Batch error: ${e.message}`)
          }
          
          if (i + batchSize < trackIds.length) {
            await new Promise(resolve => setTimeout(resolve, 200))
          }
        }
        
        console.log(`[Netease] Parse complete: ${successCount} success, ${failCount} failed`)
      }

      const result = {
        id: playlist.id.toString(),
        name: playlist.name,
        creator: playlist.creator?.nickname || '未知',
        description: playlist.description || '',
        songCount: songs.length,
        createTime: new Date(playlist.createTime || Date.now()),
        songs
      }
      
      console.log(`[Netease] Returning ${result.songs.length} songs`)
      
      return result
    } catch (error: any) {
      console.error('Parse Netease playlist error:', error.message)
      
      if (error.code === 'ECONNREFUSED') {
        throw new Error('无法连接到网易云音乐API')
      }
      
      throw new Error('解析网易云音乐歌单失败: ' + error.message)
    }
  }

  private async parseQQPlaylist(playlistId: string, url: string): Promise<PlaylistInfo> {
    try {
      let disstid = playlistId
      
      if (url.includes('n/ryqq/playlist/')) {
        const match = url.match(/playlist\/(\d+)/)
        if (match) disstid = match[1]
      }

      const response = await axios.get('https://c.y.qq.com/qzone/fcg-bin/fcg_ucc_getcdinfo_byids_cp.fcg', {
        params: {
          type: 1,
          json: 1,
          utf8: 1,
          onlysong: 0,
          disstid: disstid,
          format: 'json',
          g_tk: 5381,
          loginUin: 0,
          hostUin: 0,
          platform: 'yqq.json',
          needNewCode: 0
        },
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Referer': 'https://y.qq.com/',
          'Origin': 'https://y.qq.com'
        },
        timeout: 15000
      })

      const data = response.data
      const cdlist = data.cdlist?.[0]

      if (!cdlist) {
        throw new Error('歌单不存在或无法访问')
      }

      const songs = (cdlist.songlist || []).map((track: any) => ({
        id: track.songmid || track.id?.toString() || uuidv4(),
        name: track.songname || track.name || track.title,
        artist: (track.singer || []).map((s: any) => s.name),
        album: track.albumname || '',
        duration: track.interval || 0,
        cover: track.albummid ? `https://y.qq.com/music/photo_new/T002R300x300M000${track.albummid}.jpg` : undefined
      }))

      return {
        id: disstid,
        name: cdlist.dissname || 'QQ音乐歌单',
        creator: cdlist.nick || 'QQ音乐用户',
        description: cdlist.desc || '',
        songCount: cdlist.songnum || songs.length,
        createTime: new Date(),
        songs
      }
    } catch (error: any) {
      console.error('Parse QQ playlist error:', error.message)
      throw new Error('解析QQ音乐歌单失败: ' + error.message)
    }
  }

  private async parseKugouPlaylist(playlistId: string, url: string): Promise<PlaylistInfo> {
    try {
      let specialId = playlistId
      
      if (url.includes('special/')) {
        const match = url.match(/special\/(\d+)/)
        if (match) specialId = match[1]
      }

      const response = await axios.get('https://www.kugou.com/yy/special/single/' + specialId + '.html', {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Referer': 'https://www.kugou.com/'
        },
        timeout: 15000
      })

      const html = response.data
      const songListMatch = html.match(/global\.data\s*=\s*(\{[\s\S]*?\});/)
      
      if (songListMatch) {
        const data = JSON.parse(songListMatch[1])
        const songs = (data.list || []).map((track: any) => ({
          id: track.hash || track.id?.toString() || uuidv4(),
          name: track.songname || track.name,
          artist: (track.singername || '').split('、').filter(Boolean),
          album: track.album_name || '',
          duration: Math.floor((track.duration || 0) / 1000),
          cover: track.img || track.album_img
        }))

        return {
          id: specialId,
          name: data.name || '酷狗歌单',
          creator: data.nickname || '酷狗用户',
          description: data.intro || '',
          songCount: songs.length,
          createTime: new Date(),
          songs
        }
      }

      throw new Error('无法解析歌单内容')
    } catch (error: any) {
      console.error('Parse Kugou playlist error:', error.message)
      throw new Error('解析酷狗音乐歌单失败，请确保歌单链接正确')
    }
  }

  private async parseKuwoPlaylist(playlistId: string, url: string): Promise<PlaylistInfo> {
    try {
      let pid = playlistId
      
      if (url.includes('playlist_detail/')) {
        const match = url.match(/playlist_detail\/(\d+)/)
        if (match) pid = match[1]
      }

      const response = await axios.get('http://www.kuwo.cn/api/v1/www/music/playInfo', {
        params: {
          type: 'music',
          mid: pid,
          type: 'playlist'
        },
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Referer': 'http://www.kuwo.cn/'
        },
        timeout: 15000
      })

      const data = response.data
      
      if (data.code === 200 && data.data) {
        const playlist = data.data
        const songs = (playlist.musicList || []).map((track: any) => ({
          id: track.id?.toString() || track.rid?.toString() || uuidv4(),
          name: track.name || track.songName,
          artist: (track.artist || track.artistName || '').split('、').filter(Boolean),
          album: track.album || track.albumName || '',
          duration: Math.floor((track.duration || 0) / 1000),
          cover: track.pic || track.albumPic
        }))

        return {
          id: pid,
          name: playlist.name || '酷我歌单',
          creator: playlist.userName || '酷我用户',
          description: playlist.desc || '',
          songCount: songs.length,
          createTime: new Date(),
          songs
        }
      }

      throw new Error('歌单不存在')
    } catch (error: any) {
      console.error('Parse Kuwo playlist error:', error.message)
      throw new Error('解析酷我音乐歌单失败，请确保歌单链接正确')
    }
  }

  private async parseMiguPlaylist(playlistId: string, url: string): Promise<PlaylistInfo> {
    try {
      const response = await axios.get('https://music.migu.cn/v3/music/playlist/' + playlistId, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Referer': 'https://music.migu.cn/'
        },
        timeout: 15000
      })

      const html = response.data
      
      const nameMatch = html.match(/<h1[^>]*class="[^"]*title[^"]*"[^>]*>([^<]+)<\/h1>/)
      const name = nameMatch ? nameMatch[1].trim() : '咪咕歌单'
      
      const songMatches = html.matchAll(/<a[^>]*class="[^"]*song-name[^"]*"[^>]*>([^<]+)<\/a>/g)
      const artistMatches = html.matchAll(/<a[^>]*class="[^"]*singer-name[^"]*"[^>]*>([^<]+)<\/a>/g)
      
      const songs: Song[] = []
      const songNames = [...songMatches]
      const artistNames = [...artistMatches]
      
      for (let i = 0; i < songNames.length; i++) {
        songs.push({
          id: uuidv4(),
          name: songNames[i][1].trim(),
          artist: artistNames[i] ? [artistNames[i][1].trim()] : ['未知歌手'],
          album: '',
          duration: 0
        })
      }

      if (songs.length > 0) {
        return {
          id: playlistId,
          name: name,
          creator: '咪咕用户',
          description: '',
          songCount: songs.length,
          createTime: new Date(),
          songs
        }
      }

      throw new Error('无法解析歌单内容')
    } catch (error: any) {
      console.error('Parse Migu playlist error:', error.message)
      throw new Error('解析咪咕音乐歌单失败，请确保歌单链接正确')
    }
  }

  validateUrl(url: string, platform: Platform): boolean {
    const patterns: Record<Platform, RegExp> = {
      netease: /^https?:\/\/music\.163\.com\/(#\/)?playlist\?id=\d+/,
      qq: /^https?:\/\/y\.qq\.com\/n\/ryqq\/playlist\/\d+/,
      kugou: /^https?:\/\/www\.kugou\.com\/yy\/special\/\d+\.html/,
      kuwo: /^https?:\/\/www\.kuwo\.cn\/playlist_detail\/\d+/,
      migu: /^https?:\/\/music\.migu\.cn\/v3\/(music\/)?playlist\/\d+/,
      spotify: /^https?:\/\/open\.spotify\.com\/playlist\/[a-zA-Z0-9]+/,
      apple_music: /^https?:\/\/music\.apple\.com\/.+playlist.+/,
      youtube_music: /^https?:\/\/music\.youtube\.com\/playlist\?list=/
    }

    return patterns[platform]?.test(url) || false
  }
}
