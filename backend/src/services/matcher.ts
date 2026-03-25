import axios from 'axios'
import { Song, MatchResult, Platform } from '../types'

export class SongMatcher {
  private spotifyAccessToken: string = ''
  
  async matchSong(sourceSong: Song, targetPlatform: Platform): Promise<MatchResult> {
    try {
      const searchResults = await this.searchSong(sourceSong, targetPlatform)
      
      if (!searchResults || searchResults.length === 0) {
        return {
          sourceSong,
          confidence: 0,
          matchType: 'unmatched'
        }
      }

      const bestMatch = this.findBestMatch(sourceSong, searchResults)
      
      return bestMatch
    } catch (error) {
      console.error('Match song error:', error)
      return {
        sourceSong,
        confidence: 0,
        matchType: 'unmatched'
      }
    }
  }

  async batchMatch(songs: Song[], targetPlatform: Platform): Promise<MatchResult[]> {
    const results: MatchResult[] = []
    
    for (const song of songs) {
      const result = await this.matchSong(song, targetPlatform)
      results.push(result)
    }
    
    return results
  }

  private async searchSong(song: Song, platform: Platform): Promise<Song[]> {
    const query = `${song.name} ${song.artist.join(' ')}`
    
    switch (platform) {
      case 'spotify':
        return this.searchSpotify(query, song)
      case 'apple_music':
        return this.searchAppleMusic(query, song)
      case 'youtube_music':
        return this.searchYouTubeMusic(query, song)
      default:
        return this.mockSearch(song)
    }
  }

  private async searchSpotify(query: string, sourceSong: Song): Promise<Song[]> {
    if (process.env.SPOTIFY_CLIENT_ID && process.env.SPOTIFY_CLIENT_SECRET) {
      try {
        if (!this.spotifyAccessToken) {
          await this.getSpotifyToken()
        }
        
        const response = await axios.get('https://api.spotify.com/v1/search', {
          params: {
            q: query,
            type: 'track',
            limit: 10
          },
          headers: {
            'Authorization': `Bearer ${this.spotifyAccessToken}`
          },
          timeout: 10000
        })

        return response.data.tracks.items.map((track: any) => ({
          id: track.id,
          name: track.name,
          artist: track.artists.map((a: any) => a.name),
          album: track.album.name,
          duration: Math.floor(track.duration_ms / 1000),
          cover: track.album.images?.[0]?.url,
          uri: track.uri
        }))
      } catch (error) {
        console.error('Spotify search error:', error)
      }
    }
    
    return this.mockSearch(sourceSong)
  }

  private async getSpotifyToken(): Promise<void> {
    try {
      const response = await axios.post('https://accounts.spotify.com/api/token', 
        'grant_type=client_credentials', {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': `Basic ${Buffer.from(`${process.env.SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`).toString('base64')}`
        }
      })
      
      this.spotifyAccessToken = response.data.access_token
    } catch (error) {
      console.error('Get Spotify token error:', error)
    }
  }

  private async searchAppleMusic(query: string, sourceSong: Song): Promise<Song[]> {
    return this.mockSearch(sourceSong)
  }

  private async searchYouTubeMusic(query: string, sourceSong: Song): Promise<Song[]> {
    const apiKey = process.env.YOUTUBE_API_KEY
    
    if (apiKey) {
      try {
        const response = await axios.get('https://www.googleapis.com/youtube/v3/search', {
          params: {
            part: 'snippet',
            q: query,
            type: 'video',
            videoCategoryId: '10',
            maxResults: 10,
            key: apiKey
          },
          timeout: 15000
        })

        const results: Song[] = []
        
        for (const item of response.data.items || []) {
          const title = item.snippet?.title || ''
          const channelTitle = item.snippet?.channelTitle || ''
          
          results.push({
            id: item.id?.videoId || '',
            name: title,
            artist: [channelTitle],
            album: '',
            duration: 0,
            cover: item.snippet?.thumbnails?.high?.url || item.snippet?.thumbnails?.default?.url || '',
            uri: `youtube:music:${item.id?.videoId}`
          })
        }

        console.log(`[YouTube] 搜索 "${query}" 找到 ${results.length} 个结果`)
        return results
      } catch (error: any) {
        console.error('YouTube search error:', error.message)
      }
    }
    
    return this.mockSearch(sourceSong)
  }

  private mockSearch(sourceSong: Song): Song[] {
    const mockResults: Song[] = [
      {
        id: `mock_exact_${sourceSong.id}`,
        name: sourceSong.name,
        artist: [...sourceSong.artist],
        album: sourceSong.album,
        duration: sourceSong.duration,
        cover: sourceSong.cover,
        uri: `spotify:track:mock_exact_${sourceSong.id}`
      },
      {
        id: `mock_remaster_${sourceSong.id}`,
        name: `${sourceSong.name} (Remastered)`,
        artist: [...sourceSong.artist],
        album: `${sourceSong.album} (Remastered)`,
        duration: sourceSong.duration,
        uri: `spotify:track:mock_remaster_${sourceSong.id}`
      },
      {
        id: `mock_live_${sourceSong.id}`,
        name: `${sourceSong.name} (Live)`,
        artist: [sourceSong.artist[0]],
        album: 'Live Album',
        duration: sourceSong.duration + 30,
        uri: `spotify:track:mock_live_${sourceSong.id}`
      }
    ]

    return mockResults
  }

  private findBestMatch(sourceSong: Song, candidates: Song[]): MatchResult {
    let bestMatch: Song | null = null
    let bestScore = 0

    for (const candidate of candidates) {
      const score = this.calculateMatchScore(sourceSong, candidate)
      
      if (score > bestScore) {
        bestScore = score
        bestMatch = candidate
      }
    }

    if (!bestMatch || bestScore < 0.5) {
      return {
        sourceSong,
        confidence: bestScore,
        matchType: 'unmatched'
      }
    }

    const matchType = bestScore >= 0.9 ? 'exact' : bestScore >= 0.7 ? 'fuzzy' : 'manual'

    return {
      sourceSong,
      matchedSong: bestMatch,
      confidence: bestScore,
      matchType
    }
  }

  calculateMatchScore(sourceSong: Song, targetSong: Song): number {
    const nameSimilarity = this.calculateStringSimilarity(
      sourceSong.name,
      targetSong.name
    )

    const artistSimilarity = this.calculateArtistSimilarity(
      sourceSong.artist,
      targetSong.artist
    )

    const albumSimilarity = this.calculateStringSimilarity(
      sourceSong.album || '',
      targetSong.album || ''
    )

    const durationSimilarity = this.calculateDurationSimilarity(
      sourceSong.duration,
      targetSong.duration
    )

    const totalScore = 
      nameSimilarity * 0.4 +
      artistSimilarity * 0.35 +
      albumSimilarity * 0.15 +
      durationSimilarity * 0.1

    return totalScore
  }

  calculateStringSimilarity(str1: string, str2: string): number {
    const normalized1 = this.normalizeString(str1)
    const normalized2 = this.normalizeString(str2)

    if (normalized1 === normalized2) return 1

    const distance = this.levenshteinDistance(normalized1, normalized2)
    const maxLength = Math.max(normalized1.length, normalized2.length)
    
    if (maxLength === 0) return 1

    return 1 - distance / maxLength
  }

  private normalizeString(text: string): string {
    return text
      .toLowerCase()
      .replace(/[^\w\s\u4e00-\u9fa5]/g, '')
      .replace(/\s+/g, ' ')
      .trim()
  }

  private levenshteinDistance(str1: string, str2: string): number {
    const m = str1.length
    const n = str2.length
    const dp: number[][] = Array(m + 1).fill(null).map(() => Array(n + 1).fill(0))

    for (let i = 0; i <= m; i++) dp[i][0] = i
    for (let j = 0; j <= n; j++) dp[0][j] = j

    for (let i = 1; i <= m; i++) {
      for (let j = 1; j <= n; j++) {
        if (str1[i - 1] === str2[j - 1]) {
          dp[i][j] = dp[i - 1][j - 1]
        } else {
          dp[i][j] = Math.min(
            dp[i - 1][j - 1] + 1,
            dp[i - 1][j] + 1,
            dp[i][j - 1] + 1
          )
        }
      }
    }

    return dp[m][n]
  }

  private calculateArtistSimilarity(sourceArtists: string[], targetArtists: string[]): number {
    if (!sourceArtists.length || !targetArtists.length) return 0

    const sourceSet = new Set(sourceArtists.map(a => this.normalizeString(a)))
    const targetSet = new Set(targetArtists.map(a => this.normalizeString(a)))

    const intersection = new Set([...sourceSet].filter(x => targetSet.has(x)))
    const union = new Set([...sourceSet, ...targetSet])

    const jaccard = intersection.size / union.size

    if (intersection.size > 0) {
      return Math.min(1, jaccard + 0.3)
    }

    let maxSimilarity = 0
    for (const s of sourceSet) {
      for (const t of targetSet) {
        const sim = this.calculateStringSimilarity(s, t)
        maxSimilarity = Math.max(maxSimilarity, sim)
      }
    }

    return maxSimilarity * 0.7
  }

  private calculateDurationSimilarity(duration1: number, duration2: number): number {
    if (duration1 === 0 || duration2 === 0) return 0.5

    const diff = Math.abs(duration1 - duration2)
    const maxDiff = Math.max(duration1, duration2)

    if (diff <= 3) return 1
    if (diff <= 10) return 0.8
    if (diff <= 30) return 0.5
    
    return Math.max(0, 1 - diff / maxDiff)
  }
}
