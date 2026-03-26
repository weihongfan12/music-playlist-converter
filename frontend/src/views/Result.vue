<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { usePlaylistStore } from '@/stores/playlist'
import axios from 'axios'

const router = useRouter()
const store = usePlaylistStore()

const isExporting = ref(false)
const exportFormat = ref<'json' | 'csv' | 'm3u' | 'txt'>('txt')
const exportSuccess = ref(false)
const playlistUrl = ref('')
const createError = ref('')
const showQuickLinks = ref(false)
const searchQuery = ref('')

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

const matchedSongs = computed(() => {
  const results = matchResults.value?.results || []
  return results.filter((r: any) => r.matchedSong && r.matchType !== 'unmatched')
})

const matchedSongsText = computed(() => {
  return matchedSongs.value.map((r: any) => {
    const song = r.matchedSong
    return `${song.name} - ${song.artist?.join(', ') || '未知'}`
  }).join('\n')
})

const filteredResults = computed(() => {
  const results = matchResults.value?.results || []
  if (!searchQuery.value) return results
  const query = searchQuery.value.toLowerCase()
  return results.filter((r: any) => 
    r.sourceSong.name?.toLowerCase().includes(query) ||
    r.sourceSong.artist?.some((a: string) => a.toLowerCase().includes(query))
  )
})

const platformNames: Record<string, string> = {
  netease: '网易云音乐',
  qq: 'QQ音乐',
  kugou: '酷狗音乐',
  kuwo: '酷我音乐',
  migu: '咪咕音乐',
  spotify: 'Spotify',
  qqmusic: 'QQ音乐'
}

const platformColors: Record<string, string> = {
  netease: 'from-red-500 to-red-600',
  qq: 'from-green-500 to-green-600',
  kugou: 'from-blue-500 to-blue-600',
  kuwo: 'from-orange-500 to-orange-600',
  migu: 'from-pink-500 to-pink-600',
  spotify: 'from-green-500 to-green-600',
  qqmusic: 'from-green-500 to-green-600'
}

const platformImportUrls: Record<string, string> = {
  netease: 'https://music.163.com',
  qq: 'https://y.qq.com',
  kugou: 'https://www.kugou.com',
  kuwo: 'http://www.kuwo.cn',
  migu: 'https://music.migu.cn',
  spotify: 'https://open.spotify.com',
  qqmusic: 'https://y.qq.com'
}

function oneClickImport() {
  const platform = targetPlatform.value || 'qq'
  const text = matchedSongsText.value || ''
  const platformName = platformNames[platform] || '目标平台'
  
  navigator.clipboard.writeText(text).then(() => {
    let guide = `已复制 ${matchedSongs.value.length} 首歌曲到剪贴板！\n\n`
    
    if (platform === 'qq' || platform === 'qqmusic') {
      guide += `📱 QQ音乐导入方法：\n`
      guide += `1. 打开QQ音乐APP\n`
      guide += `2. 点击「我的」→ 右上角「更多」→「导入外部歌单」\n`
      guide += `3. 粘贴歌曲列表，点击匹配\n\n`
      guide += `即将打开QQ音乐官网...`
    } else if (platform === 'netease') {
      guide += `📱 网易云音乐导入方法：\n`
      guide += `1. 打开网易云音乐APP\n`
      guide += `2. 点击「我的」→「导入外部歌单」\n`
      guide += `3. 粘贴歌曲列表，点击匹配\n\n`
      guide += `即将打开网易云音乐官网...`
    } else {
      guide += `请前往${platformName}APP使用导入功能\n\n`
      guide += `即将打开${platformName}官网...`
    }
    
    alert(guide)
    window.open(platformImportUrls[platform] || platformImportUrls.qq, '_blank')
  })
}

function getPlatformSearchUrl(platform: string, song: any): string {
  const query = encodeURIComponent(`${song.name} ${song.artist?.join(' ') || ''}`)
  const urls: Record<string, string> = {
    netease: `https://music.163.com/#/search/m/?s=${query}&type=1`,
    qq: `https://y.qq.com/n/ryqq/search?w=${query}&t=song`,
    kugou: `https://www.kugou.com/yy/html/search.html#searchType=song&searchKeyWord=${query}`,
    kuwo: `http://www.kuwo.cn/search/list?key=${query}`,
    migu: `https://music.migu.cn/v3/search/song?text=${query}`,
    spotify: `https://open.spotify.com/search/${query}`,
    qqmusic: `https://y.qq.com/n/ryqq/search?w=${query}&t=song`
  }
  return urls[platform] || urls.qq
}

function openPlatformSearch(song: any) {
  const platform = targetPlatform.value || 'qq'
  const url = getPlatformSearchUrl(platform, song)
  window.open(url, '_blank')
}

function openAllPlatformSearches() {
  const platform = targetPlatform.value || 'qq'
  const results = matchResults.value?.results || []
  const unmatchedSongs = results.filter((r: any) => r.matchType === 'unmatched')
  
  if (unmatchedSongs.length === 0) {
    alert('所有歌曲都已匹配！')
    return
  }
  
  if (unmatchedSongs.length > 10) {
    if (!confirm(`将打开 ${unmatchedSongs.length} 个标签页，确定继续吗？`)) {
      return
    }
  }
  
  unmatchedSongs.forEach((r: any, index: number) => {
    setTimeout(() => {
      const url = getPlatformSearchUrl(platform, r.sourceSong)
      window.open(url, '_blank')
    }, index * 300)
  })
}

function copySongInfo(song: any) {
  const text = `${song.name} - ${song.artist?.join(', ') || '未知'}`
  navigator.clipboard.writeText(text).then(() => {
    alert('已复制: ' + text)
  })
}

function copyAllSongs() {
  const results = matchResults.value?.results || []
  const text = results.map((r: any) => {
    const song = r.sourceSong
    return `${song.name} - ${song.artist?.join(', ') || '未知'}`
  }).join('\n')
  
  navigator.clipboard.writeText(text).then(() => {
    alert(`已复制 ${results.length} 首歌曲信息`)
  })
}

function copyMatchedSongs() {
  const matched = matchedSongs.value
  if (matched.length === 0) {
    alert('没有匹配成功的歌曲')
    return
  }
  navigator.clipboard.writeText(matchedSongsText.value).then(() => {
    alert(`已复制 ${matched.length} 首匹配成功的歌曲`)
  })
}

async function exportFile() {
  if (!matchResults.value?.results) return
  
  isExporting.value = true
  createError.value = ''
  
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
    createError.value = '导出失败，请重试'
  } finally {
    isExporting.value = false
  }
}

function startOver() {
  store.clearAll()
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
    exact: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
    fuzzy: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    manual: 'bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400',
    unmatched: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400'
  }
  return classes[type] || ''
}

function getMatchTypeIcon(type: string) {
  const icons: Record<string, string> = {
    exact: '✓',
    fuzzy: '~',
    manual: '?',
    unmatched: '✗'
  }
  return icons[type] || ''
}
</script>

<template>
  <div class="max-w-6xl mx-auto space-y-6">
    <div v-if="!matchResults" class="card text-center py-16">
      <div class="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 flex items-center justify-center">
        <svg class="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
        </svg>
      </div>
      <h3 class="text-xl font-semibold text-gray-800 dark:text-white mb-2">暂无匹配结果</h3>
      <p class="text-gray-500 dark:text-gray-400 mb-6">请先转换一个歌单</p>
      <button @click="router.push('/convert')" class="btn btn-primary">
        开始转换
      </button>
    </div>

    <template v-else>
      <div class="bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 rounded-2xl p-1">
        <div class="bg-white dark:bg-gray-800 rounded-xl p-6">
          <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
            <div>
              <h2 class="text-2xl font-bold text-gray-900 dark:text-white">{{ playlistInfo?.name || '转换结果' }}</h2>
              <p class="text-gray-500 dark:text-gray-400 mt-1">
                从 {{ playlistInfo?.creator || '未知' }} 的歌单转换到 {{ platformNames[targetPlatform] || '目标平台' }} · {{ totalCount }} 首歌曲
              </p>
            </div>
            <div class="flex items-center gap-3">
              <button @click="oneClickImport" class="btn btn-primary bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 border-0">
                <svg class="w-5 h-5 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
                一键导入到{{ platformNames[targetPlatform] || '目标平台' }}
              </button>
              <div class="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 rounded-xl">
                <svg class="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                <select v-model="exportFormat" class="bg-transparent border-none text-sm font-medium text-gray-700 dark:text-gray-300 focus:ring-0">
                  <option value="txt">TXT</option>
                  <option value="csv">CSV</option>
                  <option value="json">JSON</option>
                  <option value="m3u">M3U</option>
                </select>
              </div>
              <button @click="exportFile" :disabled="isExporting" class="btn btn-secondary">
                {{ isExporting ? '导出中...' : '导出文件' }}
              </button>
              <button @click="startOver" class="btn btn-secondary">
                重新开始
              </button>
            </div>
          </div>

          <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div class="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/30 p-5">
              <div class="absolute top-0 right-0 w-20 h-20 -mr-6 -mt-6 rounded-full bg-blue-200/50 dark:bg-blue-700/20"></div>
              <div class="relative">
                <div class="text-4xl font-bold text-blue-600 dark:text-blue-400">{{ totalCount }}</div>
                <div class="text-sm font-medium text-blue-600/70 dark:text-blue-400/70 mt-1">总歌曲数</div>
              </div>
            </div>
            
            <div class="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-900/30 dark:to-emerald-800/30 p-5">
              <div class="absolute top-0 right-0 w-20 h-20 -mr-6 -mt-6 rounded-full bg-emerald-200/50 dark:bg-emerald-700/20"></div>
              <div class="relative">
                <div class="text-4xl font-bold text-emerald-600 dark:text-emerald-400">{{ matchedCount }}</div>
                <div class="text-sm font-medium text-emerald-600/70 dark:text-emerald-400/70 mt-1">匹配成功</div>
              </div>
            </div>
            
            <div class="relative overflow-hidden rounded-2xl bg-gradient-to-br from-rose-50 to-rose-100 dark:from-rose-900/30 dark:to-rose-800/30 p-5">
              <div class="absolute top-0 right-0 w-20 h-20 -mr-6 -mt-6 rounded-full bg-rose-200/50 dark:bg-rose-700/20"></div>
              <div class="relative">
                <div class="text-4xl font-bold text-rose-600 dark:text-rose-400">{{ unmatchedCount }}</div>
                <div class="text-sm font-medium text-rose-600/70 dark:text-rose-400/70 mt-1">未匹配</div>
              </div>
            </div>
            
            <div class="relative overflow-hidden rounded-2xl bg-gradient-to-br from-violet-50 to-violet-100 dark:from-violet-900/30 dark:to-violet-800/30 p-5">
              <div class="absolute top-0 right-0 w-20 h-20 -mr-6 -mt-6 rounded-full bg-violet-200/50 dark:bg-violet-700/20"></div>
              <div class="relative">
                <div class="text-4xl font-bold text-violet-600 dark:text-violet-400">{{ matchRate }}%</div>
                <div class="text-sm font-medium text-violet-600/70 dark:text-violet-400/70 mt-1">匹配率</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="card p-5">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white">快速复制</h3>
          <div class="flex gap-2">
            <button 
              @click="copyMatchedSongs"
              class="px-3 py-1.5 text-sm bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 rounded-lg hover:bg-emerald-200 dark:hover:bg-emerald-900/50 transition-colors"
            >
              复制匹配成功 ({{ matchedCount }}首)
            </button>
            <button 
              @click="copyAllSongs"
              class="px-3 py-1.5 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            >
              复制全部 ({{ totalCount }}首)
            </button>
          </div>
        </div>
        
        <div v-if="matchedSongs.length > 0" class="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4 max-h-48 overflow-y-auto">
          <pre class="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap font-mono">{{ matchedSongsText }}</pre>
        </div>
        <div v-else class="text-center text-gray-500 dark:text-gray-400 py-4">
          暂无匹配成功的歌曲
        </div>
      </div>

      <div class="card overflow-hidden">
        <button 
          @click="showQuickLinks = !showQuickLinks"
          class="w-full flex items-center justify-between p-5 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
        >
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
              <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div class="text-left">
              <h3 class="font-semibold text-gray-900 dark:text-white">快捷导入工具</h3>
              <p class="text-sm text-gray-500 dark:text-gray-400">使用第三方工具批量导入歌单</p>
            </div>
          </div>
          <svg 
            class="w-5 h-5 text-gray-400 transition-transform duration-200" 
            :class="showQuickLinks ? 'rotate-180' : ''"
            fill="none" stroke="currentColor" viewBox="0 0 24 24"
          >
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        
        <div v-if="showQuickLinks" class="border-t dark:border-gray-700 p-5 space-y-4">
          <div class="p-4 rounded-xl bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 border border-emerald-100 dark:border-emerald-800">
            <div class="flex items-center gap-2 mb-3">
              <span class="text-xl">�</span>
              <span class="font-semibold text-gray-800 dark:text-white">一键导入（推荐）</span>
            </div>
            <ol class="text-sm text-gray-600 dark:text-gray-400 space-y-2">
              <li class="flex items-start gap-2">
                <span class="flex-shrink-0 w-5 h-5 rounded-full bg-emerald-500 text-white text-xs flex items-center justify-center">1</span>
                <span>点击「一键导入到{{ platformNames[targetPlatform] || '目标平台' }}」按钮</span>
              </li>
              <li class="flex items-start gap-2">
                <span class="flex-shrink-0 w-5 h-5 rounded-full bg-emerald-500 text-white text-xs flex items-center justify-center">2</span>
                <span>歌曲列表自动复制到剪贴板</span>
              </li>
              <li class="flex items-start gap-2">
                <span class="flex-shrink-0 w-5 h-5 rounded-full bg-emerald-500 text-white text-xs flex items-center justify-center">3</span>
                <span>打开目标平台APP，找到「导入外部歌单」功能</span>
              </li>
              <li class="flex items-start gap-2">
                <span class="flex-shrink-0 w-5 h-5 rounded-full bg-emerald-500 text-white text-xs flex items-center justify-center">4</span>
                <span>粘贴歌曲列表，等待匹配完成即可</span>
              </li>
            </ol>
          </div>
          
          <div class="p-4 rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-100 dark:border-blue-800">
            <div class="flex items-center gap-2 mb-3">
              <span class="text-xl">💡</span>
              <span class="font-semibold text-gray-800 dark:text-white">推荐：第三方批量导入工具</span>
            </div>
            <p class="text-sm text-gray-600 dark:text-gray-400 mb-4">先导出 CSV 文件，然后使用以下工具批量导入</p>
            <div class="flex flex-wrap gap-2">
              <a href="https://www.tunemymusic.com/zh" target="_blank" 
                class="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
                TuneMyMusic
              </a>
              <a href="https://soundiiz.com" target="_blank" 
                class="inline-flex items-center gap-1.5 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-medium transition-colors">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
                Soundiiz
              </a>
            </div>
          </div>
          
          <div class="p-4 rounded-xl bg-gradient-to-r from-primary-50 to-indigo-50 dark:from-primary-900/20 dark:to-indigo-900/20 border border-primary-100 dark:border-primary-800">
            <div class="flex items-center gap-2 mb-3">
              <div class="w-8 h-8 rounded-lg bg-gradient-to-br flex items-center justify-center text-white text-sm font-bold"
                   :class="platformColors[targetPlatform] || platformColors.qq">
                {{ targetPlatform === 'netease' ? '网' : targetPlatform === 'qq' ? 'Q' : targetPlatform === 'kugou' ? '酷' : targetPlatform === 'kuwo' ? '酷' : targetPlatform === 'migu' ? '咪' : '音' }}
              </div>
              <span class="font-semibold text-gray-800 dark:text-white">{{ platformNames[targetPlatform] || '目标平台' }} 一键导入</span>
            </div>
            <p class="text-sm text-gray-600 dark:text-gray-400 mb-3">批量打开未匹配歌曲的搜索页面，快速添加到歌单</p>
            <div class="flex gap-2">
              <button @click="openAllPlatformSearches" class="flex-1 px-3 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-sm font-medium transition-colors">
                一键打开搜索
              </button>
              <button @click="copyAllSongs" class="px-3 py-2 bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium transition-colors">
                复制列表
              </button>
            </div>
          </div>
        </div>
      </div>

      <div class="card">
        <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4 p-5 border-b dark:border-gray-700">
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white">匹配详情</h3>
          <div class="relative">
            <svg class="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input 
              v-model="searchQuery"
              type="text" 
              placeholder="搜索歌曲..." 
              class="pl-10 pr-4 py-2 w-full md:w-64 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
        </div>
        
        <div class="divide-y dark:divide-gray-700 max-h-[600px] overflow-y-auto">
          <div 
            v-for="(result, index) in filteredResults" 
            :key="index"
            class="flex items-center gap-4 p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
          >
            <div class="flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 flex items-center justify-center text-gray-500 dark:text-gray-400 font-medium">
              {{ index + 1 }}
            </div>
            
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-2">
                <h4 class="font-medium text-gray-900 dark:text-white truncate">{{ result.sourceSong.name }}</h4>
                <span 
                  :class="[
                    'flex-shrink-0 px-2 py-0.5 text-xs font-medium rounded-full',
                    getMatchTypeClass(result.matchType)
                  ]"
                >
                  {{ getMatchTypeIcon(result.matchType) }} {{ getMatchTypeLabel(result.matchType) }}
                </span>
              </div>
              <p class="text-sm text-gray-500 dark:text-gray-400 truncate">
                {{ result.sourceSong.artist?.join(', ') || '未知艺术家' }}
              </p>
              
              <div v-if="result.matchedSong" class="mt-2 flex items-center gap-2">
                <svg class="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
                <span class="text-sm text-emerald-600 dark:text-emerald-400 truncate">
                  {{ result.matchedSong.name }} · {{ result.matchedSong.artist?.join(', ') }}
                </span>
                <div class="flex items-center gap-1 ml-auto">
                  <div class="w-16 h-1.5 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden">
                    <div 
                      class="h-full rounded-full transition-all duration-300"
                      :class="result.confidence > 0.8 ? 'bg-emerald-500' : result.confidence > 0.5 ? 'bg-amber-500' : 'bg-rose-500'"
                      :style="{ width: `${(result.confidence || 0) * 100}%` }"
                    ></div>
                  </div>
                  <span class="text-xs text-gray-500">{{ Math.round((result.confidence || 0) * 100) }}%</span>
                </div>
              </div>
            </div>
            
            <div class="flex items-center gap-1">
              <button 
                @click="openPlatformSearch(result.sourceSong)"
                class="p-2 text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg transition-colors"
                :title="`在 ${platformNames[targetPlatform] || '目标平台'} 搜索`"
              >
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </button>
              <button 
                @click="copySongInfo(result.sourceSong)"
                class="p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                title="复制歌曲信息"
              >
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div v-if="createError" class="p-4 rounded-xl bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800">
        <div class="flex items-start gap-3">
          <svg class="w-5 h-5 text-rose-500 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p class="text-rose-700 dark:text-rose-400 whitespace-pre-line">{{ createError }}</p>
        </div>
      </div>

      <div v-if="playlistUrl" class="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800">
        <div class="flex items-center gap-3">
          <svg class="w-5 h-5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p class="text-emerald-700 dark:text-emerald-400">
            歌单创建成功！
            <a :href="playlistUrl" target="_blank" class="underline font-medium hover:text-emerald-800 dark:hover:text-emerald-300">点击查看</a>
          </p>
        </div>
      </div>
    </template>
  </div>
</template>
