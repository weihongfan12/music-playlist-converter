<script setup lang="ts">
import { RouterLink } from 'vue-router'

const platforms = [
  { name: '网易云音乐', color: 'netease', icon: '🎵', gradient: 'from-red-500 to-red-600' },
  { name: 'QQ音乐', color: 'qq', icon: '🎶', gradient: 'from-green-500 to-green-600' },
  { name: '酷狗音乐', color: 'kugou', icon: '🎧', gradient: 'from-blue-500 to-blue-600' },
  { name: '酷我音乐', color: 'kugou', icon: '📻', gradient: 'from-orange-500 to-orange-600' },
  { name: '咪咕音乐', color: 'netease', icon: '🎼', gradient: 'from-pink-500 to-pink-600' },
]

const targetPlatforms = [
  { name: 'Spotify', color: 'spotify', icon: '🟢', gradient: 'from-spotify to-green-600' },
  { name: 'Apple Music', color: 'apple', icon: '🔴', gradient: 'from-apple to-red-600' },
  { name: 'YouTube Music', color: 'youtube', icon: '▶️', gradient: 'from-red-500 to-red-600' },
]

const features = [
  {
    title: '智能匹配',
    description: '采用先进的歌曲匹配算法，准确率高达95%以上',
    icon: '🎯',
    gradient: 'from-blue-500 to-cyan-500'
  },
  {
    title: '批量转换',
    description: '支持一次转换整个歌单，节省您的宝贵时间',
    icon: '⚡',
    gradient: 'from-yellow-500 to-orange-500'
  },
  {
    title: '多平台支持',
    description: '支持国内外主流音乐平台之间的互相转换',
    icon: '🌐',
    gradient: 'from-purple-500 to-pink-500'
  },
  {
    title: '安全可靠',
    description: '数据加密传输，保护您的隐私安全',
    icon: '🔒',
    gradient: 'from-green-500 to-emerald-500'
  }
]

const stats = [
  { value: '5+', label: '支持平台' },
  { value: '95%', label: '匹配准确率' },
  { value: '10K+', label: '用户使用' },
  { value: '100%', label: '免费使用' },
]
</script>

<template>
  <div class="relative overflow-hidden">
    <div class="absolute inset-0 overflow-hidden pointer-events-none">
      <div class="absolute -top-40 -right-40 w-80 h-80 bg-primary-500/10 rounded-full blur-3xl"></div>
      <div class="absolute top-1/2 -left-40 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl"></div>
      <div class="absolute -bottom-40 right-1/3 w-80 h-80 bg-pink-500/10 rounded-full blur-3xl"></div>
    </div>

    <section class="relative text-center py-20 lg:py-32">
      <div class="max-w-4xl mx-auto px-4">
        <div class="inline-flex items-center px-4 py-2 rounded-full bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 text-sm font-medium mb-8">
          <span class="w-2 h-2 bg-primary-500 rounded-full mr-2"></span>
          全新升级 · 支持更多平台
        </div>
        
        <h1 class="text-5xl lg:text-7xl font-bold mb-6">
          <span class="text-gray-900 dark:text-white">音乐歌单</span>
          <br>
          <span class="gradient-text">转换工具</span>
        </h1>
        
        <p class="text-xl text-gray-600 dark:text-gray-400 mb-10 max-w-2xl mx-auto">
          轻松将您的歌单从一个音乐平台迁移到另一个平台，<br class="hidden md:block">
          支持网易云、QQ音乐、Spotify等主流平台
        </p>
        
        <div class="flex flex-col sm:flex-row items-center justify-center gap-4">
          <RouterLink 
            to="/convert" 
            class="btn btn-primary text-base px-8 py-4 group"
          >
            开始转换
            <svg class="w-5 h-5 ml-2 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </RouterLink>
          <a href="#features" class="btn btn-ghost text-base px-8 py-4">
            了解更多
          </a>
        </div>
      </div>
    </section>

    <section class="py-12 border-y border-gray-200/50 dark:border-gray-700/50 bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm">
      <div class="max-w-6xl mx-auto px-4">
        <div class="grid grid-cols-2 md:grid-cols-4 gap-8">
          <div v-for="stat in stats" :key="stat.label" class="text-center">
            <div class="text-3xl lg:text-4xl font-bold gradient-text mb-2">{{ stat.value }}</div>
            <div class="text-sm text-gray-500 dark:text-gray-400">{{ stat.label }}</div>
          </div>
        </div>
      </div>
    </section>

    <section id="features" class="py-20">
      <div class="max-w-6xl mx-auto px-4">
        <div class="text-center mb-16">
          <h2 class="text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white mb-4">
            功能特点
          </h2>
          <p class="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            强大的功能，简洁的操作，让歌单迁移变得前所未有的简单
          </p>
        </div>
        
        <div class="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div 
            v-for="(feature, index) in features" 
            :key="feature.title"
            class="card p-6 group hover:-translate-y-1"
          >
            <div 
              class="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl mb-4 bg-gradient-to-br"
              :class="feature.gradient"
            >
              {{ feature.icon }}
            </div>
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">{{ feature.title }}</h3>
            <p class="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">{{ feature.description }}</p>
          </div>
        </div>
      </div>
    </section>

    <section class="py-20 bg-gradient-to-b from-transparent via-primary-50/50 to-transparent dark:via-primary-950/20">
      <div class="max-w-6xl mx-auto px-4">
        <h2 class="text-3xl lg:text-4xl font-bold text-center text-gray-900 dark:text-white mb-16">
          支持的平台
        </h2>
        
        <div class="grid lg:grid-cols-2 gap-8">
          <div class="card p-8">
            <div class="flex items-center mb-6">
              <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center mr-3">
                <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
              </div>
              <h3 class="text-xl font-semibold text-gray-900 dark:text-white">源平台</h3>
            </div>
            <div class="flex flex-wrap gap-3">
              <span 
                v-for="platform in platforms" 
                :key="platform.name"
                class="inline-flex items-center px-4 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-sm font-medium border border-gray-200 dark:border-gray-700 hover:border-primary-300 dark:hover:border-primary-700 transition-colors cursor-default"
              >
                <span class="mr-2">{{ platform.icon }}</span>
                {{ platform.name }}
              </span>
            </div>
          </div>
          
          <div class="card p-8">
            <div class="flex items-center mb-6">
              <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center mr-3">
                <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
                </svg>
              </div>
              <h3 class="text-xl font-semibold text-gray-900 dark:text-white">目标平台</h3>
            </div>
            <div class="flex flex-wrap gap-3">
              <span 
                v-for="platform in targetPlatforms" 
                :key="platform.name"
                class="inline-flex items-center px-4 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-sm font-medium border border-gray-200 dark:border-gray-700 hover:border-purple-300 dark:hover:border-purple-700 transition-colors cursor-default"
              >
                <span class="mr-2">{{ platform.icon }}</span>
                {{ platform.name }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>

    <section class="py-20">
      <div class="max-w-4xl mx-auto px-4">
        <h2 class="text-3xl lg:text-4xl font-bold text-center text-gray-900 dark:text-white mb-16">
          使用步骤
        </h2>
        
        <div class="relative">
          <div class="hidden md:block absolute top-1/2 left-0 right-0 h-0.5 bg-gradient-to-r from-primary-500 via-purple-500 to-pink-500 transform -translate-y-1/2"></div>
          
          <div class="grid md:grid-cols-3 gap-8 relative">
            <div class="card p-6 text-center relative z-10">
              <div class="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center shadow-lg shadow-primary-500/25">
                <span class="text-2xl font-bold text-white">1</span>
              </div>
              <h3 class="font-semibold text-gray-900 dark:text-white mb-2">粘贴歌单链接</h3>
              <p class="text-sm text-gray-600 dark:text-gray-400">复制您想转换的歌单链接</p>
            </div>
            
            <div class="card p-6 text-center relative z-10">
              <div class="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center shadow-lg shadow-purple-500/25">
                <span class="text-2xl font-bold text-white">2</span>
              </div>
              <h3 class="font-semibold text-gray-900 dark:text-white mb-2">选择目标平台</h3>
              <p class="text-sm text-gray-600 dark:text-gray-400">选择您要转换到的平台</p>
            </div>
            
            <div class="card p-6 text-center relative z-10">
              <div class="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-pink-500 to-pink-600 flex items-center justify-center shadow-lg shadow-pink-500/25">
                <span class="text-2xl font-bold text-white">3</span>
              </div>
              <h3 class="font-semibold text-gray-900 dark:text-white mb-2">一键转换</h3>
              <p class="text-sm text-gray-600 dark:text-gray-400">点击转换，等待完成</p>
            </div>
          </div>
        </div>
      </div>
    </section>

    <section class="py-20">
      <div class="max-w-4xl mx-auto px-4 text-center">
        <div class="card-glass p-12 relative overflow-hidden">
          <div class="absolute inset-0 bg-gradient-to-r from-primary-500/10 via-purple-500/10 to-pink-500/10"></div>
          <div class="relative z-10">
            <h2 class="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white mb-4">
              准备好开始了吗？
            </h2>
            <p class="text-gray-600 dark:text-gray-400 mb-8">
              立即体验，让您的音乐歌单自由迁移
            </p>
            <RouterLink 
              to="/convert" 
              class="btn btn-primary text-base px-10 py-4"
            >
              开始转换
            </RouterLink>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>
