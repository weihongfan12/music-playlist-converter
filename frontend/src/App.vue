<script setup lang="ts">
import { RouterView } from 'vue-router'
import Header from './components/Header.vue'
</script>

<template>
  <div class="min-h-screen bg-surface-50 dark:bg-surface-950 text-surface-900 dark:text-surface-50">
    <Header />
    <main class="container mx-auto px-4 py-8">
      <RouterView />
    </main>
    <footer class="border-t border-surface-200/50 dark:border-surface-700/50 py-8 mt-16">
      <div class="container mx-auto px-4 text-center text-surface-500 dark:text-surface-400 text-sm">
        <p>© 2024 音乐歌单转换工具. All rights reserved.</p>
        <p class="mt-2">
          Made with ❤️ using Vue 3 + TypeScript
        </p>
      </div>
    </footer>
  </div>
</template>
