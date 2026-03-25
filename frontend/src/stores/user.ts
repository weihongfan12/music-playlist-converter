import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import axios from 'axios'

interface User {
  id: string
  username: string
  avatar?: string
  createdAt: string
}

export const useUserStore = defineStore('user', () => {
  const user = ref<User | null>(null)
  const token = ref<string | null>(localStorage.getItem('token'))

  const isLoggedIn = computed(() => !!user.value && !!token.value)

  async function init() {
    const savedToken = localStorage.getItem('token')
    if (savedToken) {
      token.value = savedToken
      axios.defaults.headers.common['Authorization'] = `Bearer ${savedToken}`
      await fetchProfile()
    }
  }

  async function fetchProfile() {
    try {
      const response = await axios.get('/api/v1/auth/profile')
      if (response.data.code === 200) {
        user.value = response.data.data
      }
    } catch (error) {
      console.error('Fetch profile error:', error)
      logout()
    }
  }

  async function register(username: string, password: string) {
    const response = await axios.post('/api/v1/auth/register', {
      username,
      password
    })
    
    if (response.data.code === 200) {
      token.value = response.data.data.token
      user.value = response.data.data.user
      localStorage.setItem('token', token.value!)
      axios.defaults.headers.common['Authorization'] = `Bearer ${token.value}`
    }
    
    return response.data
  }

  async function login(username: string, password: string) {
    const response = await axios.post('/api/v1/auth/login', {
      username,
      password
    })
    
    if (response.data.code === 200) {
      token.value = response.data.data.token
      user.value = response.data.data.user
      localStorage.setItem('token', token.value!)
      axios.defaults.headers.common['Authorization'] = `Bearer ${token.value}`
    }
    
    return response.data
  }

  function logout() {
    user.value = null
    token.value = null
    localStorage.removeItem('token')
    delete axios.defaults.headers.common['Authorization']
  }

  async function updateProfile(data: { username?: string }) {
    const response = await axios.put('/api/v1/auth/profile', data)
    
    if (response.data.code === 200) {
      user.value = response.data.data
    }
    
    return response.data
  }

  async function uploadAvatar(file: File) {
    const formData = new FormData()
    formData.append('avatar', file)
    
    const response = await axios.post('/api/v1/auth/avatar', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
    
    if (response.data.code === 200) {
      await fetchProfile()
    }
    
    return response.data
  }

  async function changePassword(oldPassword: string, newPassword: string) {
    const response = await axios.put('/api/v1/auth/password', {
      oldPassword,
      newPassword
    })
    
    return response.data
  }

  async function forgotPassword(email: string) {
    const response = await axios.post('/api/v1/auth/forgot-password', { email })
    return response.data
  }

  async function resetPassword(token: string, newPassword: string) {
    const response = await axios.post('/api/v1/auth/reset-password', { token, newPassword })
    return response.data
  }

  return {
    user,
    token,
    isLoggedIn,
    init,
    fetchProfile,
    register,
    login,
    logout,
    updateProfile,
    uploadAvatar,
    changePassword,
    forgotPassword,
    resetPassword
  }
})
