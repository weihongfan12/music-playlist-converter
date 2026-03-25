<script setup lang="ts">
import { RouterLink } from 'vue-router'
import { useUserStore } from '@/stores/user'

const userStore = useUserStore()
</script>

<template>
  <header class="bg-white dark:bg-gray-800 shadow-sm sticky top-0 z-50">
    <div class="container mx-auto px-4 py-4 flex items-center justify-between">
      <RouterLink to="/" class="flex items-center space-x-3">
        <div class="w-10 h-10 bg-gradient-to-r from-primary-500 to-primary-600 rounded-xl flex items-center justify-center">
          <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
          </svg>
        </div>
        <span class="text-xl font-bold text-gray-800 dark:text-white">歌单转换工具</span>
      </RouterLink>
      <nav class="flex items-center space-x-6">
        <RouterLink to="/" class="text-gray-600 hover:text-primary-600 dark:text-gray-300 dark:hover:text-primary-400 transition-colors">
          首页
        </RouterLink>
        <RouterLink to="/convert" class="text-gray-600 hover:text-primary-600 dark:text-gray-300 dark:hover:text-primary-400 transition-colors">
          开始转换
        </RouterLink>
        
        <div v-if="userStore.isLoggedIn" class="flex items-center space-x-4">
          <RouterLink to="/profile" class="flex items-center space-x-2">
            <div class="w-8 h-8 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700">
              <img
                v-if="userStore.user?.avatar"
                :src="userStore.user.avatar"
                alt="头像"
                class="w-full h-full object-cover"
              />
              <div v-else class="w-full h-full flex items-center justify-center text-sm text-gray-500">
                {{ userStore.user?.username?.charAt(0).toUpperCase() }}
              </div>
            </div>
            <span class="text-gray-700 dark:text-gray-300">{{ userStore.user?.username }}</span>
          </RouterLink>
        </div>
        
        <div v-else class="flex items-center space-x-4">
          <RouterLink to="/login" class="text-gray-600 hover:text-primary-600 dark:text-gray-300 dark:hover:text-primary-400 transition-colors">
            登录
          </RouterLink>
          <RouterLink to="/login" class="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors">
            注册
          </RouterLink>
        </div>
      </nav>
    </div>
  </header>
</template>
