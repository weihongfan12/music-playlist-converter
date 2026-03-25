<script setup lang="ts">
import { RouterView } from 'vue-router'
import Header from './components/Header.vue'
import { useUserStore } from '@/stores/user'
import { onMounted } from 'vue'

const userStore = useUserStore()

onMounted(async () => {
  console.log('[App] Initializing user state...')
  await userStore.init()
  console.log('[App] User state initialized:', userStore.isLoggedIn)
})
</script>

<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-50">
    <Header />
    <main class="container mx-auto px-4 py-8">
      <RouterView />
    </main>
    <footer class="border-t border-gray-200/50 dark:border-gray-700/50 py-8 mt-16">
      <div class="container mx-auto px-4 text-center text-gray-500 dark:text-gray-400 text-sm">
        <p>© 2026 音乐歌单转换工具. All rights reserved.</p>
      </div>
    </footer>
  </div>
</template>
