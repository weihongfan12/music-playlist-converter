<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'

const router = useRouter()
const userStore = useUserStore()

const editMode = ref(false)
const username = ref('')
const oldPassword = ref('')
const newPassword = ref('')
const confirmPassword = ref('')
const error = ref('')
const success = ref('')
const isLoading = ref(false)
const avatarFile = ref<File | null>(null)
const avatarPreview = ref('')

const avatarUrl = computed(() => {
  if (!userStore.user?.avatar) return ''
  if (userStore.user.avatar.startsWith('http')) {
    return userStore.user.avatar
  }
  return `http://localhost:3001${userStore.user.avatar}`
})

onMounted(() => {
  if (!userStore.isLoggedIn) {
    router.push('/login')
    return
  }
  username.value = userStore.user?.username || ''
})

function startEdit() {
  editMode.value = true
  username.value = userStore.user?.username || ''
}

function cancelEdit() {
  editMode.value = false
  username.value = userStore.user?.username || ''
}

async function saveProfile() {
  error.value = ''
  success.value = ''
  isLoading.value = true

  try {
    await userStore.updateProfile({ username: username.value })
    success.value = '保存成功'
    editMode.value = false
  } catch (e: any) {
    error.value = e.response?.data?.message || '保存失败'
  } finally {
    isLoading.value = false
  }
}

function handleAvatarChange(event: Event) {
  const target = event.target as HTMLInputElement
  if (target.files && target.files[0]) {
    avatarFile.value = target.files[0]
    avatarPreview.value = URL.createObjectURL(target.files[0])
    uploadAvatar()
  }
}

async function uploadAvatar() {
  if (!avatarFile.value) return

  error.value = ''
  success.value = ''
  isLoading.value = true

  try {
    await userStore.uploadAvatar(avatarFile.value)
    success.value = '头像上传成功'
    avatarPreview.value = ''
    avatarFile.value = null
  } catch (e: any) {
    error.value = e.response?.data?.message || '上传失败'
  } finally {
    isLoading.value = false
  }
}

async function changePassword() {
  error.value = ''
  success.value = ''

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
    await userStore.changePassword(oldPassword.value, newPassword.value)
    success.value = '密码修改成功'
    oldPassword.value = ''
    newPassword.value = ''
    confirmPassword.value = ''
  } catch (e: any) {
    error.value = e.response?.data?.message || '修改失败'
  } finally {
    isLoading.value = false
  }
}

function logout() {
  userStore.logout()
  router.push('/')
}

function formatDate(date: string) {
  return new Date(date).toLocaleDateString('zh-CN')
}
</script>

<template>
  <div class="max-w-2xl mx-auto">
    <div v-if="!userStore.isLoggedIn" class="card text-center py-12">
      <p class="text-gray-600 dark:text-gray-400 mb-4">请先登录</p>
      <router-link to="/login" class="btn btn-primary">去登录</router-link>
    </div>

    <div v-else class="space-y-6">
      <div class="card p-8">
        <div class="flex items-center justify-between mb-8">
          <h2 class="text-xl font-bold text-gray-800 dark:text-white">个人资料</h2>
          <div class="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center shadow-lg shadow-primary-500/25">
            <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
        </div>

        <div v-if="error" class="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-600 dark:text-red-400 text-sm">
          {{ error }}
        </div>

        <div v-if="success" class="mb-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg text-green-600 dark:text-green-400 text-sm">
          {{ success }}
        </div>

        <div class="flex items-start space-x-6">
          <div class="relative group">
            <div class="w-24 h-24 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700 ring-2 ring-offset-2 ring-primary-500/20">
              <img
                v-if="avatarPreview || avatarUrl"
                :src="avatarPreview || avatarUrl"
                alt="头像"
                class="w-full h-full object-cover"
                @error="avatarPreview = ''"
              />
              <div v-else class="w-full h-full flex items-center justify-center text-3xl text-gray-400 bg-gradient-to-br from-primary-400 to-primary-600 text-white font-bold">
                {{ userStore.user?.username?.charAt(0).toUpperCase() }}
              </div>
            </div>

            <label class="absolute -bottom-0 right-0 w-8 h-8 bg-primary-500 rounded-full flex items-center justify-center cursor-pointer hover:bg-primary-600 transition-colors shadow-lg">
              <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <input
                type="file"
                accept="image/*"
                class="hidden"
                @change="handleAvatarChange"
              />
            </label>
          </div>

          <div class="flex-1">
            <div v-if="!editMode">
              <h3 class="text-lg font-semibold text-gray-800 dark:text-white">
                {{ userStore.user?.username }}
              </h3>
              <p class="text-sm text-gray-500 mt-2">
                注册于 {{ formatDate(userStore.user?.createdAt || '') }}
              </p>
              <button
                @click="startEdit"
                class="mt-4 btn btn-secondary text-sm"
              >
                编辑资料
              </button>
            </div>

            <div v-else class="space-y-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  用户名
                </label>
                <input
                  v-model="username"
                  type="text"
                  class="input"
                  placeholder="请输入用户名"
                />
              </div>

              <div class="flex space-x-2">
                <button
                  @click="saveProfile"
                  :disabled="isLoading"
                  class="btn btn-primary"
                >
                  保存
                </button>
                <button @click="cancelEdit" class="btn btn-secondary">
                  取消
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="card p-8">
        <div class="flex items-center justify-between mb-6">
          <h2 class="text-xl font-bold text-gray-800 dark:text-white">修改密码</h2>
          <div class="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg shadow-amber-500/25">
            <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
        </div>
        <form @submit.prevent="changePassword" class="space-y-4 max-w-md">
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              原密码
            </label>
            <input
              v-model="oldPassword"
              type="password"
              class="input"
              placeholder="请输入原密码"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              新密码
            </label>
            <input
              v-model="newPassword"
              type="password"
              class="input"
              placeholder="请输入新密码"
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
              minlength="6"
            />
          </div>

          <button
            type="submit"
            :disabled="isLoading || !oldPassword || !newPassword"
            class="btn btn-primary"
          >
            {{ isLoading ? '处理中...' : '修改密码' }}
          </button>
        </form>
      </div>

      <div class="card p-8">
        <div class="flex items-center justify-between">
          <div>
            <h2 class="text-xl font-bold text-gray-800 dark:text-white mb-2">退出登录</h2>
            <p class="text-gray-500 text-sm">退出当前账号</p>
          </div>
          <button
            @click="logout"
            class="px-6 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
          >
            退出登录
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
