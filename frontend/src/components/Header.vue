<script setup lang="ts">
import { RouterLink } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { computed } from 'vue'

const userStore = useUserStore()

const avatarUrl = computed(() => {
  if (!userStore.user?.avatar) return ''
  if (userStore.user.avatar.startsWith('http')) {
    return userStore.user.avatar
  }
  return `http://localhost:3001${userStore.user.avatar}`
})
</script>

<template>
  <header class="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-b border-gray-200/50 dark:border-gray-700/50 sticky top-0 z-50">
    <div class="container mx-auto px-4 py-4 flex items-center justify-between">
      <RouterLink to="/" class="flex items-center space-x-3 group">
        <div class="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center shadow-lg shadow-primary-500/25">
          <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
          </svg>
        </div>
        <span class="text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white to-gray-200 bg-clip-text text-transparent">歌单转换工具</span>
      </RouterLink>
      
      <nav class="flex items-center space-x-8">
        <RouterLink 
          to="/" 
          class="text-gray-600 hover:text-primary-600 dark:text-gray-300 dark:hover:text-primary-400 transition-colors px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
        >
          首页
        </RouterLink>
        <RouterLink 
          to="/convert" 
          class="text-gray-600 hover:text-primary-600 dark:text-gray-300 dark:hover:text-primary-400 transition-colors px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
        >
          开始转换
        </RouterLink>
        
        <div v-if="userStore.isLoggedIn" class="flex items-center space-x-4">
          <RouterLink to="/profile" class="flex items-center space-x-2 px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
            <div class="w-8 h-8 rounded-full overflow-hidden bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center">
              <img
                v-if="avatarUrl"
                :src="avatarUrl"
                alt="头像"
                class="w-full h-full object-cover"
              />
              <span v-else class="text-sm font-semibold text-white">
                {{ userStore.user?.username?.charAt(0).toUpperCase() }}
              </span>
            </div>
            <span class="text-gray-700 dark:text-gray-300 font-medium">{{ userStore.user?.username }}</span>
          </RouterLink>
        </div>
        
        <div v-else class="flex items-center space-x-3">
          <RouterLink 
            to="/login" 
            class="text-gray-600 hover:text-primary-600 dark:text-gray-300 dark:hover:text-primary-400 transition-colors px-4 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 font-medium"
          >
            登录
          </RouterLink>
          <RouterLink 
            to="/register" 
            class="px-5 py-2.5 bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-xl font-medium hover:from-primary-600 hover:to-primary-700 transition-all shadow-lg shadow-primary-500/25"
          >
            注册
          </RouterLink>
        </div>
      </nav>
    </div>
  </header>
</template>
