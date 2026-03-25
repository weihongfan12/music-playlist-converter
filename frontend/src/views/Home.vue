<script setup lang="ts">
import { RouterLink } from 'vue-router'

const platforms = [
  { name: '网易云音乐', color: 'netease', icon: '🎵' },
  { name: 'QQ音乐', color: 'qq', icon: '🎶' },
  { name: '酷狗音乐', color: 'kugou', icon: '🎧' },
  { name: '酷我音乐', color: 'kugou', icon: '📻' },
  { name: '咪咕音乐', color: 'netease', icon: '🎼' },
]

const targetPlatforms = [
  { name: 'Spotify', color: 'spotify', icon: '🟢' },
  { name: 'Apple Music', color: 'apple', icon: '🔴' },
  { name: 'YouTube Music', color: 'youtube', icon: '▶️' },
]

const features = [
  {
    title: '智能匹配',
    description: '采用先进的歌曲匹配算法，准确率高达95%以上',
    icon: '🎯'
  },
  {
    title: '批量转换',
    description: '支持一次转换整个歌单，节省您的宝贵时间',
    icon: '⚡'
  },
  {
    title: '多平台支持',
    description: '支持国内外主流音乐平台之间的互相转换',
    icon: '🌐'
  },
  {
    title: '安全可靠',
    description: '数据加密传输，保护您的隐私安全',
    icon: '🔒'
  }
]
</script>

<template>
  <div>
    <section class="text-center py-16">
      <h1 class="text-5xl font-bold text-gray-800 dark:text-white mb-6">
        音乐歌单转换工具
      </h1>
      <p class="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-2xl mx-auto">
        轻松将您的歌单从一个音乐平台迁移到另一个平台，支持网易云、QQ音乐、Spotify等主流平台
      </p>
      <RouterLink 
        to="/convert" 
        class="inline-flex items-center px-8 py-4 bg-gradient-to-r from-primary-500 to-primary-600 text-white text-lg font-semibold rounded-xl hover:from-primary-600 hover:to-primary-700 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-1"
      >
        开始转换
        <svg class="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
        </svg>
      </RouterLink>
    </section>

    <section class="py-12">
      <h2 class="text-3xl font-bold text-center text-gray-800 dark:text-white mb-12">支持的平台</h2>
      <div class="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
        <div class="card">
          <h3 class="text-xl font-semibold text-gray-800 dark:text-white mb-4">源平台</h3>
          <div class="flex flex-wrap gap-3">
            <span 
              v-for="platform in platforms" 
              :key="platform.name"
              class="px-4 py-2 bg-gray-100 dark:bg-gray-700 rounded-full text-gray-700 dark:text-gray-300"
            >
              {{ platform.icon }} {{ platform.name }}
            </span>
          </div>
        </div>
        <div class="card">
          <h3 class="text-xl font-semibold text-gray-800 dark:text-white mb-4">目标平台</h3>
          <div class="flex flex-wrap gap-3">
            <span 
              v-for="platform in targetPlatforms" 
              :key="platform.name"
              class="px-4 py-2 bg-gray-100 dark:bg-gray-700 rounded-full text-gray-700 dark:text-gray-300"
            >
              {{ platform.icon }} {{ platform.name }}
            </span>
          </div>
        </div>
      </div>
    </section>

    <section class="py-12">
      <h2 class="text-3xl font-bold text-center text-gray-800 dark:text-white mb-12">功能特点</h2>
      <div class="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
        <div v-for="feature in features" :key="feature.title" class="card text-center">
          <div class="text-4xl mb-4">{{ feature.icon }}</div>
          <h3 class="text-lg font-semibold text-gray-800 dark:text-white mb-2">{{ feature.title }}</h3>
          <p class="text-gray-600 dark:text-gray-400">{{ feature.description }}</p>
        </div>
      </div>
    </section>

    <section class="py-12">
      <div class="max-w-4xl mx-auto">
        <h2 class="text-3xl font-bold text-center text-gray-800 dark:text-white mb-8">使用步骤</h2>
        <div class="flex flex-col md:flex-row items-center justify-between gap-8">
          <div class="flex-1 text-center">
            <div class="w-16 h-16 bg-primary-100 dark:bg-primary-900 rounded-full flex items-center justify-center mx-auto mb-4">
              <span class="text-2xl font-bold text-primary-600">1</span>
            </div>
            <h3 class="font-semibold text-gray-800 dark:text-white mb-2">粘贴歌单链接</h3>
            <p class="text-gray-600 dark:text-gray-400">复制您想转换的歌单链接</p>
          </div>
          <div class="hidden md:block text-gray-300">
            <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </div>
          <div class="flex-1 text-center">
            <div class="w-16 h-16 bg-primary-100 dark:bg-primary-900 rounded-full flex items-center justify-center mx-auto mb-4">
              <span class="text-2xl font-bold text-primary-600">2</span>
            </div>
            <h3 class="font-semibold text-gray-800 dark:text-white mb-2">选择目标平台</h3>
            <p class="text-gray-600 dark:text-gray-400">选择您要转换到的平台</p>
          </div>
          <div class="hidden md:block text-gray-300">
            <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </div>
          <div class="flex-1 text-center">
            <div class="w-16 h-16 bg-primary-100 dark:bg-primary-900 rounded-full flex items-center justify-center mx-auto mb-4">
              <span class="text-2xl font-bold text-primary-600">3</span>
            </div>
            <h3 class="font-semibold text-gray-800 dark:text-white mb-2">一键转换</h3>
            <p class="text-gray-600 dark:text-gray-400">点击转换，等待完成</p>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>
