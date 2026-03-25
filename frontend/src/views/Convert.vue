<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { usePlaylistStore } from '@/stores/playlist'
import axios from 'axios'

const router = useRouter()
const store = usePlaylistStore()

const playlistUrl = ref('')
const selectedSourcePlatform = ref('')
const selectedTargetPlatform = ref('')
const isLoading = ref(false)
const error = ref('')
const playlistInfo = ref<any>(null)
const step = ref(1)
const matchProgress = ref(0)
const isCancelled = ref(false)

const sourcePlatforms = [
  { id: 'netease', name: '网易云音乐', icon: '🎵', color: 'from-red-500 to-red-600' },
  { id: 'qq', name: 'QQ音乐', icon: '🎶', color: 'from-green-500 to-green-600' },
  { id: 'kugou', name: '酷狗音乐', icon: '🎧', color: 'from-blue-500 to-blue-600' },
  { id: 'kuwo', name: '酷我音乐', icon: '📻', color: 'from-orange-500 to-orange-600' },
  { id: 'migu', name: '咪咕音乐', icon: '🎼', color: 'from-pink-500 to-pink-600' },
]

const targetPlatforms = [
  { id: 'netease', name: '网易云音乐', icon: '🎵', color: 'from-red-500 to-red-600', available: true },
  { id: 'qq', name: 'QQ音乐', icon: '🎶', color: 'from-green-500 to-green-600', available: true },
  { id: 'kugou', name: '酷狗音乐', icon: '🎧', color: 'from-blue-500 to-blue-600', available: true },
  { id: 'kuwo', name: '酷我音乐', icon: '📻', color: 'from-orange-500 to-orange-600', available: true },
  { id: 'migu', name: '咪咕音乐', icon: '🎼', color: 'from-pink-500 to-pink-600', available: true },
]

const canProceed = computed(() => {
  if (step.value === 1) {
    return playlistUrl.value && selectedSourcePlatform.value
  }
  if (step.value === 2) {
    return selectedTargetPlatform.value
  }
  return false
})

async function parsePlaylist() {
  if (!canProceed.value) return

  isLoading.value = true
  error.value = ''

  try {
    const result = await store.parsePlaylist(playlistUrl.value, selectedSourcePlatform.value)
    playlistInfo.value = result
    step.value = 2
  } catch (e: any) {
    error.value = e.message || '网络错误，请稍后重试'
  } finally {
    isLoading.value = false
  }
}

async function searchTarget(query: string, platform: string): Promise<any[]> {
  try {
    console.log(`[搜索] 开始搜索: ${query}, 平台: ${platform}`)
    
    const response = await axios.get('/api/v1/proxy/search', {
      params: { q: query, platform },
      timeout: 10000
    })
    
    const items = response.data.items || []
    console.log(`[搜索] 成功，找到 ${items.length} 个结果`)
    
    return items
  } catch (e: any) {
    console.error('[搜索] 失败:', e.message)
    return []
  }
}

function calculateMatchScore(sourceSong: any, targetSong: any): number {
  const normalizeStr = (str: string) => str.toLowerCase().replace(/[^\w\s\u4e00-\u9fa5]/g, '').trim()
  
  const sourceName = normalizeStr(sourceSong.name || '')
  const targetName = normalizeStr(targetSong.name || '')
  const sourceArtist = (sourceSong.artist || []).map((a: string) => normalizeStr(a)).join(' ')
  const targetArtist = (targetSong.artist || []).map((a: string) => normalizeStr(a)).join(' ')
  
  let nameScore = 0
  let artistScore = 0
  
  if (sourceName && targetName) {
    if (sourceName === targetName) {
      nameScore = 1
    } else if (sourceName.includes(targetName) || targetName.includes(sourceName)) {
      nameScore = 0.8
    } else {
      const commonChars = [...sourceName].filter(c => targetName.includes(c)).length
      nameScore = commonChars / Math.max(sourceName.length, targetName.length) * 0.6
    }
  }
  
  if (sourceArtist && targetArtist) {
    if (sourceArtist === targetArtist) {
      artistScore = 1
    } else if (sourceArtist.includes(targetArtist) || targetArtist.includes(sourceArtist)) {
      artistScore = 0.7
    } else {
      const sourceArtistWords = sourceArtist.split(' ')
      const targetArtistWords = targetArtist.split(' ')
      const commonWords = sourceArtistWords.filter((w: string) => 
        targetArtistWords.some((tw: string) => tw.includes(w) || w.includes(tw))
      ).length
      artistScore = commonWords / Math.max(sourceArtistWords.length, targetArtistWords.length) * 0.5
    }
  }
  
  const score = nameScore * 0.6 + artistScore * 0.4
  
  return Math.min(1, score)
}

async function matchSongs() {
  if (!canProceed.value || !playlistInfo.value) return
  
  isLoading.value = true
  error.value = ''
  matchProgress.value = 0
  isCancelled.value = false
  
  const songs = playlistInfo.value.songs || []
  const results: any[] = []
  
  console.log(`[匹配] 开始匹配 ${songs.length} 首歌曲`)
  
  const batchSize = 10
  
  try {
    for (let i = 0; i < songs.length; i += batchSize) {
      if (isCancelled.value) {
        console.log('[匹配] 用户取消了匹配')
        break
      }
      
      const batch = songs.slice(i, Math.min(i + batchSize, songs.length))
      
      const batchPromises = batch.map(async (song: any) => {
        if (isCancelled.value) return null
        
        const query = `${song.name} ${song.artist?.join(' ') || ''}`
        
        try {
          const searchResults = await searchTarget(query, selectedTargetPlatform.value)
          
          if (isCancelled.value) return null
          
          let bestMatch: any = null
          let bestScore = 0
          
          for (const result of searchResults) {
            const score = calculateMatchScore(song, result)
            if (score > bestScore) {
              bestScore = score
              bestMatch = result
            }
          }
          
          if (bestMatch && bestScore >= 0.2) {
            return {
              sourceSong: song,
              matchedSong: bestMatch,
              confidence: bestScore,
              matchType: bestScore >= 0.7 ? 'exact' : bestScore >= 0.5 ? 'fuzzy' : 'manual'
            }
          } else {
            return {
              sourceSong: song,
              confidence: bestScore,
              matchType: 'unmatched'
            }
          }
        } catch (e: any) {
          return {
            sourceSong: song,
            confidence: 0,
            matchType: 'unmatched'
          }
        }
      })
      
      const batchResults = await Promise.all(batchPromises)
      const validResults = batchResults.filter(r => r !== null)
      results.push(...validResults)
      
      matchProgress.value = Math.round((Math.min(i + batchSize, songs.length) / songs.length) * 100)
      
      if (i + batchSize < songs.length && !isCancelled.value) {
        await new Promise(resolve => setTimeout(resolve, 50))
      }
    }
    
    if (isCancelled.value) {
      isLoading.value = false
      matchProgress.value = 0
      return
    }
    
    const matched = results.filter(r => r.matchType !== 'unmatched').length
    console.log(`[匹配] 完成: ${matched}/${results.length} 首匹配成功`)
    
    store.setMatchResults({
      total: results.length,
      matched,
      unmatched: results.length - matched,
      results
    })
    store.setTargetPlatform(selectedTargetPlatform.value)
    router.push('/result')
    
  } catch (e: any) {
    console.error('[匹配] 错误:', e)
    error.value = '匹配失败，请重试'
  } finally {
    isLoading.value = false
  }
}

function cancelMatch() {
  isCancelled.value = true
  isLoading.value = false
  matchProgress.value = 0
  console.log('[匹配] 用户取消')
}

function goBack() {
  if (step.value > 1) {
    step.value--
  }
}
</script>

<template>
  <div class="max-w-3xl mx-auto py-8">
    <div class="card p-8">
      <div class="flex items-center justify-center mb-10">
        <div class="flex items-center">
          <div 
            :class="[
              'w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-lg transition-all duration-300',
              step >= 1 
                ? 'bg-gradient-to-br from-primary-500 to-primary-600 text-white shadow-lg shadow-primary-500/25' 
                : 'bg-gray-100 dark:bg-gray-800 text-gray-400'
            ]"
          >
            <svg v-if="step > 1" class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
            </svg>
            <span v-else>1</span>
          </div>
          <div class="w-24 h-1 mx-4 rounded-full transition-all duration-300" :class="step >= 2 ? 'bg-primary-500' : 'bg-gray-200 dark:bg-gray-700'"></div>
          <div 
            :class="[
              'w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-lg transition-all duration-300',
              step >= 2 
                ? 'bg-gradient-to-br from-primary-500 to-primary-600 text-white shadow-lg shadow-primary-500/25' 
                : 'bg-gray-100 dark:bg-gray-800 text-gray-400'
            ]"
          >
            <svg v-if="step > 2" class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
            </svg>
            <span v-else>2</span>
          </div>
          <div class="w-24 h-1 mx-4 rounded-full transition-all duration-300" :class="step >= 3 ? 'bg-primary-500' : 'bg-gray-200 dark:bg-gray-700'"></div>
          <div 
            :class="[
              'w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-lg transition-all duration-300',
              step >= 3 
                ? 'bg-gradient-to-br from-primary-500 to-primary-600 text-white shadow-lg shadow-primary-500/25' 
                : 'bg-gray-100 dark:bg-gray-800 text-gray-400'
            ]"
          >
            3
          </div>
        </div>
      </div>

      <div v-if="error" class="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-red-600 dark:text-red-400 text-sm flex items-center">
        <svg class="w-5 h-5 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        {{ error }}
      </div>

      <div v-if="isLoading && matchProgress > 0" class="mb-6">
        <div class="flex items-center justify-between mb-2">
          <span class="text-sm text-gray-600 dark:text-gray-400">匹配进度</span>
          <span class="text-sm font-medium text-primary-600">{{ matchProgress }}%</span>
        </div>
        <div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
          <div 
            class="bg-gradient-to-r from-primary-500 to-primary-600 h-2 rounded-full transition-all duration-300"
            :style="{ width: matchProgress + '%' }"
          ></div>
        </div>
      </div>

      <div v-if="step === 1">
        <div class="text-center mb-8">
          <h2 class="text-2xl font-bold text-gray-900 dark:text-white mb-2">输入歌单信息</h2>
          <p class="text-gray-500 dark:text-gray-400">粘贴歌单链接并选择来源平台</p>
        </div>
        
        <div class="space-y-6">
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              歌单链接
            </label>
            <div class="relative">
              <span class="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                </svg>
              </span>
              <input 
                v-model="playlistUrl"
                type="text" 
                class="input pl-12"
                placeholder="https://music.163.com/playlist?id=12345678"
              />
            </div>
            <p class="mt-2 text-sm text-gray-500 dark:text-gray-400">
              支持网易云音乐、QQ音乐、酷狗、酷我、咪咕等平台
            </p>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              源平台
            </label>
            <div class="grid grid-cols-2 sm:grid-cols-5 gap-3">
              <button
                v-for="platform in sourcePlatforms"
                :key="platform.id"
                @click="selectedSourcePlatform = platform.id"
                :class="[
                  'relative p-4 rounded-xl border-2 transition-all duration-200 text-center group',
                  selectedSourcePlatform === platform.id 
                    ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20' 
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                ]"
              >
                <div 
                  class="w-10 h-10 rounded-xl mx-auto mb-2 flex items-center justify-center text-lg bg-gradient-to-br"
                  :class="platform.color"
                >
                  {{ platform.icon }}
                </div>
                <span class="text-sm font-medium text-gray-700 dark:text-gray-300">{{ platform.name }}</span>
                <div 
                  v-if="selectedSourcePlatform === platform.id"
                  class="absolute -top-1 -right-1 w-5 h-5 bg-primary-500 rounded-full flex items-center justify-center"
                >
                  <svg class="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              </button>
            </div>
          </div>

          <button 
            @click="parsePlaylist"
            :disabled="!canProceed || isLoading"
            class="btn btn-primary w-full py-4 text-base"
          >
            <svg v-if="isLoading" class="animate-spin -ml-1 mr-2 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            {{ isLoading ? '解析中...' : '解析歌单' }}
          </button>
        </div>
      </div>

      <div v-if="step === 2 && playlistInfo">
        <div class="flex items-center mb-8">
          <button @click="goBack" class="mr-4 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
            <svg class="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div>
            <h2 class="text-2xl font-bold text-gray-900 dark:text-white">选择目标平台</h2>
            <p class="text-gray-500 dark:text-gray-400 text-sm mt-1">选择您要转换到的音乐平台</p>
          </div>
        </div>

        <div class="mb-8 p-5 bg-gradient-to-r from-primary-50 to-purple-50 dark:from-primary-900/20 dark:to-purple-900/20 rounded-xl border border-primary-100 dark:border-primary-800">
          <div class="flex items-start">
            <div class="w-12 h-12 bg-white dark:bg-gray-800 rounded-xl flex items-center justify-center shadow-sm mr-4">
              <svg class="w-6 h-6 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
              </svg>
            </div>
            <div class="flex-1">
              <h3 class="font-semibold text-gray-900 dark:text-white mb-1">{{ playlistInfo.name }}</h3>
              <p class="text-sm text-gray-500 dark:text-gray-400 mb-2">创建者: {{ playlistInfo.creator }}</p>
              <div class="flex items-center space-x-4 text-sm">
                <span class="inline-flex items-center text-primary-600 dark:text-primary-400">
                  <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                  </svg>
                  {{ playlistInfo.songCount }} 首歌曲
                </span>
              </div>
            </div>
          </div>
        </div>

        <div class="space-y-6">
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              目标平台
            </label>
            <div class="grid grid-cols-3 gap-4">
              <button
                v-for="platform in targetPlatforms"
                :key="platform.id"
                @click="selectedTargetPlatform = platform.id"
                :class="[
                  'relative p-5 rounded-xl border-2 transition-all duration-200 text-center group',
                  selectedTargetPlatform === platform.id 
                    ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20' 
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                ]"
              >
                <div 
                  class="w-12 h-12 rounded-xl mx-auto mb-3 flex items-center justify-center text-2xl bg-gradient-to-br"
                  :class="platform.color"
                >
                  {{ platform.icon }}
                </div>
                <span class="text-sm font-medium text-gray-700 dark:text-gray-300">{{ platform.name }}</span>
                <div 
                  v-if="selectedTargetPlatform === platform.id"
                  class="absolute -top-1 -right-1 w-5 h-5 bg-primary-500 rounded-full flex items-center justify-center"
                >
                  <svg class="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              </button>
            </div>
          </div>

          <div class="flex gap-3">
            <button 
              @click="matchSongs"
              :disabled="!canProceed || isLoading"
              class="btn btn-primary flex-1 py-4 text-base"
            >
              <svg v-if="isLoading" class="animate-spin -ml-1 mr-2 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              {{ isLoading ? `匹配中... ${matchProgress}%` : '开始匹配' }}
            </button>
            <button 
              v-if="isLoading"
              @click="cancelMatch"
              class="btn btn-secondary py-4 px-6 text-base"
            >
              取消
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
