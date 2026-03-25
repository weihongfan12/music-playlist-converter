import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src')
    }
  },
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true
      },
      '/netease-api': {
        target: 'https://api-enhanced-kappa-vert.vercel.app',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/netease-api/, ''),
        secure: false,
        timeout: 60000,
        proxyTimeout: 60000
      }
    }
  }
})
