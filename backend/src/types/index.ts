export interface Song {
  id: string
  name: string
  artist: string[]
  album: string
  duration: number
  cover?: string
  uri?: string
}

export interface PlaylistInfo {
  id: string
  name: string
  creator: string
  description: string
  songCount: number
  createTime: Date
  songs: Song[]
}

export interface MatchResult {
  sourceSong: Song
  matchedSong?: Song
  confidence: number
  matchType: 'exact' | 'fuzzy' | 'manual' | 'unmatched'
}

export interface MatchResponse {
  total: number
  matched: number
  unmatched: number
  results: MatchResult[]
}

export type Platform = 'netease' | 'qq' | 'kugou' | 'kuwo' | 'migu' | 'spotify' | 'apple_music' | 'youtube_music'

export type ExportFormat = 'json' | 'csv' | 'm3u'

export interface ExportResult {
  success: boolean
  playlistId?: string
  playlistUrl?: string
  unmatchedCount: number
  errors: string[]
}

export interface ApiResponse<T = any> {
  code: number
  message?: string
  data?: T
}
