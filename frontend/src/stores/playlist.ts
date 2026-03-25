import { defineStore } from 'pinia'
import { ref } from 'vue'

export const usePlaylistStore = defineStore('playlist', () => {
  const playlistInfo = ref<any>(null)
  const matchResults = ref<any>(null)
  const targetPlatform = ref<string>('')

  function setPlaylistInfo(info: any) {
    playlistInfo.value = info
  }

  function setMatchResults(results: any) {
    matchResults.value = results
  }

  function setTargetPlatform(platform: string) {
    targetPlatform.value = platform
  }

  function reset() {
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
    reset
  }
})
