<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { usePlaylistStore } from '@/stores/playlist'
import axios from 'axios'

const router = useRouter()
const store = usePlaylistStore()

const isExporting = ref(false)
const exportFormat = ref<'json' | 'csv' | 'm3u'>('csv')
const exportSuccess = ref(false)
const playlistUrl = ref('')

const matchResults = computed(() => store.matchResults)
const playlistInfo = computed(() => store.playlistInfo)
const targetPlatform = computed(() => store.targetPlatform)

const matchedCount = computed(() => matchResults.value?.matched || 0)
const unmatchedCount = computed(() => matchResults.value?.unmatched || 0)
const totalCount = computed(() => matchResults.value?.total || 0)
const matchRate = computed(() => {
  if (totalCount.value === 0) return 0
  return Math.round((matchedCount.value / totalCount.value) * 100)
})

async function exportFile() {
  if (!matchResults.value?.results) return
  
  isExporting.value = true
  
  try {
    const response = await axios.post('/api/v1/playlist/export', {
      songs: matchResults.value.results,
      format: exportFormat.value
    }, {
      responseType: 'blob'
    })
    
    const url = window.URL.createObjectURL(new Blob([response.data]))
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `playlist.${exportFormat.value}`)
    document.body.appendChild(link)
    link.click()
    link.remove()
    window.URL.revokeObjectURL(url)
    
    exportSuccess.value = true
  } catch (e) {
    console.error('Export failed:', e)
  } finally {
    isExporting.value = false
  }
}

async function createPlaylist() {
  if (!matchResults.value?.results || !targetPlatform.value) return
  
  isExporting.value = true
  
  try {
    const songUris = matchResults.value.results
      .filter((r: any) => r.matchedSong?.uri)
      .map((r: any) => r.matchedSong.uri)
    
    const response = await axios.post('/api/v1/playlist/create', {
      playlistName: playlistInfo.value?.name || '导入的歌单',
      platform: targetPlatform.value,
      songUris
    })
    
    if (response.data.code === 200) {
      playlistUrl.value = response.data.data.playlistUrl
      exportSuccess.value = true
    }
  } catch (e) {
    console.error('Create playlist failed:', e)
  } finally {
    isExporting.value = false
  }
}

function startOver() {
  store.reset()
  router.push('/convert')
}

function getMatchTypeLabel(type: string) {
  const labels: Record<string, string> = {
    exact: '精确匹配',
    fuzzy: '模糊匹配',
    manual: '手动匹配',
    unmatched: '未匹配'
  }
  return labels[type] || type
}

function getMatchTypeClass(type: string) {
  const classes: Record<string, string> = {
    exact: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
    fuzzy: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400',
    manual: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400',
    unmatched: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
  }
  return classes[type] || ''
}
</script>

<template>
  <div class="max-w-5xl mx-auto">
    <div v-if="!matchResults" class="card text-center py-12">
      <p class="text-gray-600 dark:text-gray-400 mb-4">暂无匹配结果</p>
      <button @click="router.push('/convert')" class="btn btn-primary">
        去转换
      </button>
    </div>

    <div v-else>
      <div class="card mb-6">
        <h2 class="text-2xl font-bold text-gray-800 dark:text-white mb-6">转换结果</h2>
        
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div class="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <div class="text-3xl font-bold text-primary-600">{{ totalCount }}</div>
            <div class="text-sm text-gray-600 dark:text-gray-400">总歌曲数</div>
          </div>
          <div class="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
            <div class="text-3xl font-bold text-green-600">{{ matchedCount }}</div>
            <div class="text-sm text-gray-600 dark:text-gray-400">匹配成功</div>
          </div>
          <div class="text-center p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
            <div class="text-3xl font-bold text-red-600">{{ unmatchedCount }}</div>
            <div class="text-sm text-gray-600 dark:text-gray-400">未匹配</div>
          </div>
          <div class="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <div class="text-3xl font-bold text-blue-600">{{ matchRate }}%</div>
            <div class="text-sm text-gray-600 dark:text-gray-400">匹配率</div>
          </div>
        </div>

        <div class="flex flex-wrap gap-4">
          <div class="flex items-center space-x-2">
            <label class="text-sm text-gray-600 dark:text-gray-400">导出格式：</label>
            <select v-model="exportFormat" class="px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600">
              <option value="csv">CSV</option>
              <option value="json">JSON</option>
              <option value="m3u">M3U</option>
            </select>
          </div>
          <button 
            @click="exportFile"
            :disabled="isExporting"
            class="btn btn-secondary"
          >
            {{ isExporting ? '导出中...' : '导出文件' }}
          </button>
          <button 
            @click="createPlaylist"
            :disabled="isExporting"
            class="btn btn-primary"
          >
            创建歌单
          </button>
          <button @click="startOver" class="btn btn-secondary">
            重新开始
          </button>
        </div>

        <div v-if="playlistUrl" class="mt-4 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
          <p class="text-green-800 dark:text-green-400">
            歌单创建成功！
            <a :href="playlistUrl" target="_blank" class="underline">点击查看</a>
          </p>
        </div>
      </div>

      <div class="card">
        <h3 class="text-xl font-bold text-gray-800 dark:text-white mb-4">匹配详情</h3>
        <div class="overflow-x-auto">
          <table class="w-full">
            <thead>
              <tr class="border-b dark:border-gray-700">
                <th class="text-left py-3 px-4 text-gray-600 dark:text-gray-400 font-medium">原歌曲</th>
                <th class="text-left py-3 px-4 text-gray-600 dark:text-gray-400 font-medium">匹配结果</th>
                <th class="text-left py-3 px-4 text-gray-600 dark:text-gray-400 font-medium">匹配度</th>
                <th class="text-left py-3 px-4 text-gray-600 dark:text-gray-400 font-medium">状态</th>
              </tr>
            </thead>
            <tbody>
              <tr 
                v-for="(result, index) in matchResults.results" 
                :key="index"
                class="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50"
              >
                <td class="py-3 px-4">
                  <div class="font-medium text-gray-800 dark:text-white">{{ result.sourceSong.name }}</div>
                  <div class="text-sm text-gray-500">{{ result.sourceSong.artist?.join(', ') }}</div>
                </td>
                <td class="py-3 px-4">
                  <div v-if="result.matchedSong">
                    <div class="font-medium text-gray-800 dark:text-white">{{ result.matchedSong.name }}</div>
                    <div class="text-sm text-gray-500">{{ result.matchedSong.artist?.join(', ') }}</div>
                  </div>
                  <div v-else class="text-gray-400">-</div>
                </td>
                <td class="py-3 px-4">
                  <div v-if="result.confidence" class="flex items-center">
                    <div class="w-16 h-2 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden mr-2">
                      <div 
                        class="h-full rounded-full"
                        :class="result.confidence > 0.8 ? 'bg-green-500' : result.confidence > 0.5 ? 'bg-yellow-500' : 'bg-red-500'"
                        :style="{ width: `${result.confidence * 100}%` }"
                      ></div>
                    </div>
                    <span class="text-sm text-gray-600 dark:text-gray-400">{{ Math.round(result.confidence * 100) }}%</span>
                  </div>
                  <div v-else class="text-gray-400">-</div>
                </td>
                <td class="py-3 px-4">
                  <span 
                    :class="[
                      'px-2 py-1 text-xs rounded-full',
                      getMatchTypeClass(result.matchType)
                    ]"
                  >
                    {{ getMatchTypeLabel(result.matchType) }}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>
