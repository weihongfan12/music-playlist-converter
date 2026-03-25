<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'

const router = useRouter()
const userStore = useUserStore()

const isLogin = ref(true)
const email = ref('')
const password = ref('')
const username = ref('')
const confirmPassword = ref('')
const error = ref('')
const isLoading = ref(false)

async function handleSubmit() {
  error.value = ''
  isLoading.value = true

  try {
    if (isLogin.value) {
      await userStore.login(email.value, password.value)
      router.push('/')
    } else {
      if (password.value !== confirmPassword.value) {
        error.value = '两次输入的密码不一致'
        return
      }
      await userStore.register(username.value, email.value, password.value)
      router.push('/')
    }
  } catch (e: any) {
    error.value = e.response?.data?.message || '操作失败，请稍后重试'
  } finally {
    isLoading.value = false
  }
}

function switchMode() {
  isLogin.value = !isLogin.value
  error.value = ''
}

function goToForgotPassword() {
  router.push('/forgot-password')
}
</script>

<template>
  <div class="min-h-[80vh] flex items-center justify-center">
    <div class="card w-full max-w-md">
      <h2 class="text-2xl font-bold text-center text-gray-800 dark:text-white mb-8">
        {{ isLogin ? '登录' : '注册' }}
      </h2>

      <div v-if="error" class="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-600 dark:text-red-400 text-sm">
        {{ error }}
      </div>

      <form @submit.prevent="handleSubmit" class="space-y-4">
        <div v-if="!isLogin">
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            用户名
          </label>
          <input
            v-model="username"
            type="text"
            class="input"
            placeholder="请输入用户名"
            required
          />
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            邮箱
          </label>
          <input
            v-model="email"
            type="email"
            class="input"
            placeholder="请输入邮箱"
            required
          />
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            密码
          </label>
          <input
            v-model="password"
            type="password"
            class="input"
            placeholder="请输入密码"
            required
            minlength="6"
          />
        </div>

        <div v-if="!isLogin">
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            确认密码
          </label>
          <input
            v-model="confirmPassword"
            type="password"
            class="input"
            placeholder="请再次输入密码"
            required
            minlength="6"
          />
        </div>

        <button
          type="submit"
          :disabled="isLoading"
          class="w-full py-3 bg-primary-500 text-white rounded-lg font-semibold hover:bg-primary-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {{ isLoading ? '处理中...' : (isLogin ? '登录' : '注册') }}
        </button>
      </form>

      <div class="mt-6 text-center space-y-2">
        <button
          @click="switchMode"
          class="text-primary-600 hover:text-primary-700 text-sm"
        >
          {{ isLogin ? '没有账号？立即注册' : '已有账号？立即登录' }}
        </button>
        
        <button
          v-if="isLogin"
          @click="goToForgotPassword"
          class="block w-full text-gray-500 hover:text-gray-700 text-sm"
        >
          忘记密码？
        </button>
      </div>
    </div>
  </div>
</template>
