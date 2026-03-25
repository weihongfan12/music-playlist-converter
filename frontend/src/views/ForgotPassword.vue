<script setup lang="ts">
import { ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useUserStore } from '@/stores/user'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()

const email = ref('')
const step = ref(1)
const token = ref('')
const newPassword = ref('')
const confirmPassword = ref('')
const error = ref('')
const success = ref('')
const isLoading = ref(false)

if (route.query.token) {
  token.value = route.query.token as string
  step.value = 2
}

async function handleSendEmail() {
  error.value = ''
  isLoading.value = true

  try {
    await userStore.forgotPassword(email.value)
    success.value = '如果该邮箱已注册，您将收到重置密码的邮件'
    step.value = 1.5
  } catch (e: any) {
    error.value = e.response?.data?.message || '发送失败，请稍后重试'
  } finally {
    isLoading.value = false
  }
}

async function handleResetPassword() {
  error.value = ''

  if (newPassword.value !== confirmPassword.value) {
    error.value = '两次输入的密码不一致'
    return
  }

  if (newPassword.value.length < 6) {
    error.value = '密码长度至少6位'
    return
  }

  isLoading.value = true

  try {
    await userStore.resetPassword(token.value, newPassword.value)
    success.value = '密码重置成功'
    setTimeout(() => {
      router.push('/login')
    }, 2000)
  } catch (e: any) {
    error.value = e.response?.data?.message || '重置失败，请稍后重试'
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <div class="min-h-[80vh] flex items-center justify-center">
    <div class="card w-full max-w-md">
      <h2 class="text-2xl font-bold text-center text-gray-800 dark:text-white mb-8">
        找回密码
      </h2>

      <div v-if="error" class="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-600 dark:text-red-400 text-sm">
        {{ error }}
      </div>

      <div v-if="success" class="mb-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg text-green-600 dark:text-green-400 text-sm">
        {{ success }}
      </div>

      <div v-if="step === 1">
        <p class="text-gray-600 dark:text-gray-400 mb-6 text-center">
          请输入您的注册邮箱，我们将发送重置密码链接
        </p>
        <form @submit.prevent="handleSendEmail" class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              邮箱
            </label>
            <input
              v-model="email"
              type="email"
              class="input"
              placeholder="请输入注册邮箱"
              required
            />
          </div>

          <button
            type="submit"
            :disabled="isLoading"
            class="w-full py-3 bg-primary-500 text-white rounded-lg font-semibold hover:bg-primary-600 transition-colors disabled:opacity-50"
          >
            {{ isLoading ? '发送中...' : '发送重置邮件' }}
          </button>
        </form>
      </div>

      <div v-else-if="step === 1.5">
        <p class="text-gray-600 dark:text-gray-400 text-center">
          重置邮件已发送，请检查您的邮箱
        </p>
      </div>

      <div v-else-if="step === 2">
        <form @submit.prevent="handleResetPassword" class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              新密码
            </label>
            <input
              v-model="newPassword"
              type="password"
              class="input"
              placeholder="请输入新密码"
              required
              minlength="6"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              确认密码
            </label>
            <input
              v-model="confirmPassword"
              type="password"
              class="input"
              placeholder="请再次输入新密码"
              required
              minlength="6"
            />
          </div>

          <button
            type="submit"
            :disabled="isLoading"
            class="w-full py-3 bg-primary-500 text-white rounded-lg font-semibold hover:bg-primary-600 transition-colors disabled:opacity-50"
          >
            {{ isLoading ? '处理中...' : '重置密码' }}
          </button>
        </form>
      </div>

      <div class="mt-6 text-center">
        <router-link to="/login" class="text-primary-600 hover:text-primary-700 text-sm">
          返回登录
        </router-link>
      </div>
    </div>
  </div>
</template>
