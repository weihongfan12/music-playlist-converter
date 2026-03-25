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
const matchResults = ref<any>(null)
const step = ref(1)

const sourcePlatforms = [
  { id: 'netease', name: '网易云音乐', color: 'bg-red-500', example: 'music.163.com/playlist?id=xxx' },
  { id: 'qq', name: 'QQ音乐', color: 'bg-green-500', example: 'y.qq.com/n/ryqq/playlist/xxx' },
  { id: 'kugou', name: '酷狗音乐', color: 'bg-blue-500', example: 'kugou.com/yy/special/xxx.html' },
  { id: 'kuwo', name: '酷我音乐', color: 'bg-orange-500', example: 'kuwo.cn/playlist_detail/xxx' },
  { id: 'migu', name: '咪咕音乐', color: 'bg-pink-500', example: 'music.migu.cn/v3/playlist/xxx' },
]

const targetPlatforms = [
  { id: 'spotify', name: 'Spotify', color: 'bg-spotify', icon: '🟢', available: true },
  { id: 'apple_music', name: 'Apple Music', color: 'bg-apple', icon: '🔴', available: true },
  { id: 'youtube_music', name: 'YouTube Music', color: 'bg-youtube', icon: '▶️', available: true },
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
    const response = await axios.post('/api/v1/playlist/parse', {
      url: playlistUrl.value,
      platform: selectedSourcePlatform.value
    })
    
    if (response.data.code === 200) {
      playlistInfo.value = response.data.data
      store.setPlaylistInfo(response.data.data)
      step.value = 2
    } else {
      error.value = response.data.message || '解析失败'
    }
  } catch (e: any) {
    error.value = e.response?.data?.message || '网络错误，请稍后重试'
  } finally {
    isLoading.value = false
  }
}

async function matchSongs() {
  if (!canProceed.value || !playlistInfo.value) return
  
  isLoading.value = true
  error.value = ''
  
  try {
    const response = await axios.post('/api/v1/songs/match', {
      songs: playlistInfo.value.songs,
      targetPlatform: selectedTargetPlatform.value,
      matchStrategy: 'auto'
    })
    
    if (response.data.code === 200) {
      matchResults.value = response.data.data
      store.setMatchResults(response.data.data)
      store.setTargetPlatform(selectedTargetPlatform.value)
      router.push('/result')
    } else {
      error.value = response.data.message || '匹配失败'
    }
  } catch (e: any) {
    error.value = e.response?.data?.message || '网络错误，请稍后重试'
  } finally {
    isLoading.value = false
  }
}

function goBack() {
  if (step.value > 1) {
    step.value--
  }
}

function getPlatformName(id: string) {
  const platform = [...sourcePlatforms, ...targetPlatforms].find(p => p.id === id)
  return platform?.name || id
}
</script>

<template>
  <div class="max-w-4xl mx-auto">
    <div class="card">
      <div class="flex items-center justify-center mb-8">
        <div class="flex items-center space-x-4">
          <div 
            :class="[
              'w-10 h-10 rounded-full flex items-center justify-center font-bold transition-all',
              step >= 1 ? 'bg-primary-500 text-white' : 'bg-gray-200 text-gray-500'
            ]"
          >
            1
          </div>
          <div class="w-20 h-1" :class="step >= 2 ? 'bg-primary-500' : 'bg-gray-200'"></div>
          <div 
            :class="[
              'w-10 h-10 rounded-full flex items-center justify-center font-bold transition-all',
              step >= 2 ? 'bg-primary-500 text-white' : 'bg-gray-200 text-gray-500'
            ]"
          >
            2
          </div>
          <div class="w-20 h-1" :class="step >= 3 ? 'bg-primary-500' : 'bg-gray-200'"></div>
          <div 
            :class="[
              'w-10 h-10 rounded-full flex items-center justify-center font-bold transition-all',
              step >= 3 ? 'bg-primary-500 text-white' : 'bg-gray-200 text-gray-500'
            ]"
          >
            3
          </div>
        </div>
      </div>

      <div v-if="error" class="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-600 dark:text-red-400">
        {{ error }}
      </div>

      <div v-if="step === 1">
        <h2 class="text-2xl font-bold text-gray-800 dark:text-white mb-6">输入歌单信息</h2>
        
        <div class="space-y-6">
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              歌单链接
            </label>
            <input 
              v-model="playlistUrl"
              type="text" 
              class="input"
              placeholder="请粘贴歌单链接，如：https://music.163.com/playlist?id=12345678"
            />
            <p class="mt-2 text-sm text-gray-500">
              支持网易云音乐、QQ音乐、酷狗、酷我、咪咕等平台
            </p>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              源平台
            </label>
            <div class="grid grid-cols-2 md:grid-cols-5 gap-3">
              <button
                v-for="platform in sourcePlatforms"
                :key="platform.id"
                @click="selectedSourcePlatform = platform.id"
                :class="[
                  'p-3 rounded-lg border-2 transition-all text-center',
                  selectedSourcePlatform === platform.id 
                    ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20' 
                    : 'border-gray-200 hover:border-gray-300'
                ]"
              >
                <span class="text-sm font-medium text-gray-800 dark:text-white">{{ platform.name }}</span>
              </button>
            </div>
          </div>

          <button 
            @click="parsePlaylist"
            :disabled="!canProceed || isLoading"
            :class="[
              'w-full py-3 rounded-lg font-semibold transition-all',
              canProceed && !isLoading
                ? 'bg-primary-500 text-white hover:bg-primary-600' 
                : 'bg-gray-200 text-gray-500 cursor-not-allowed'
            ]"
          >
            {{ isLoading ? '解析中...' : '解析歌单' }}
          </button>
        </div>
      </div>

      <div v-if="step === 2 && playlistInfo">
        <div class="flex items-center mb-6">
          <button @click="goBack" class="mr-4 text-gray-500 hover:text-gray-700">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h2 class="text-2xl font-bold text-gray-800 dark:text-white">选择目标平台</h2>
        </div>

        <div class="mb-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <h3 class="font-semibold text-gray-800 dark:text-white mb-2">{{ playlistInfo.name }}</h3>
          <p class="text-gray-600 dark:text-gray-400 mb-1">创建者: {{ playlistInfo.creator }}</p>
          <p class="text-gray-600 dark:text-gray-400">共 {{ playlistInfo.songCount }} 首歌曲</p>
        </div>

        <div class="space-y-6">
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              目标平台
            </label>
            <div class="grid grid-cols-3 gap-3">
              <button
                v-for="platform in targetPlatforms"
                :key="platform.id"
                @click="selectedTargetPlatform = platform.id"
                :class="[
                  'p-4 rounded-lg border-2 transition-all text-center',
                  selectedTargetPlatform === platform.id 
                    ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20' 
                    : 'border-gray-200 hover:border-gray-300'
                ]"
              >
                <span class="text-2xl mb-2 block">{{ platform.icon }}</span>
                <span class="text-sm font-medium text-gray-800 dark:text-white">{{ platform.name }}</span>
              </button>
            </div>
            <p class="mt-2 text-sm text-gray-500">
              注: Spotify/Apple Music 需要配置API密钥，YouTube Music 可直接使用
            </p>
          </div>

          <button 
            @click="matchSongs"
            :disabled="!canProceed || isLoading"
            :class="[
              'w-full py-3 rounded-lg font-semibold transition-all',
              canProceed && !isLoading
                ? 'bg-primary-500 text-white hover:bg-primary-600' 
                : 'bg-gray-200 text-gray-500 cursor-not-allowed'
            ]"
          >
            {{ isLoading ? '匹配中...' : '开始匹配' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
