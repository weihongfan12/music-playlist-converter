import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import axios from 'axios'

export interface User {
  id: string
  username: string
  email: string
  avatar?: string
  createdAt: string
}

export const useUserStore = defineStore('user', () => {
  const user = ref<User | null>(null)
  const token = ref<string | null>(localStorage.getItem('token'))

  const isLoggedIn = computed(() => !!token.value && !!user.value)

  function setAuth(userData: User, authToken: string) {
    user.value = userData
    token.value = authToken
    localStorage.setItem('token', authToken)
    axios.defaults.headers.common['Authorization'] = `Bearer ${authToken}`
  }

  function clearAuth() {
    user.value = null
    token.value = null
    localStorage.removeItem('token')
    delete axios.defaults.headers.common['Authorization']
  }

  async function fetchProfile() {
    if (!token.value) return
    
    try {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token.value}`
      const response = await axios.get('/api/v1/auth/profile')
      
      if (response.data.code === 200) {
        user.value = response.data.data
      }
    } catch (error) {
      clearAuth()
    }
  }

  async function login(email: string, password: string) {
    const response = await axios.post('/api/v1/auth/login', { email, password })
    
    if (response.data.code === 200) {
      setAuth(response.data.data.user, response.data.data.token)
    }
    
    return response.data
  }

  async function register(username: string, email: string, password: string) {
    const response = await axios.post('/api/v1/auth/register', { 
      username, 
      email, 
      password 
    })
    
    if (response.data.code === 200) {
      setAuth(response.data.data.user, response.data.data.token)
    }
    
    return response.data
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
    
    if (response.data.code === 200 && user.value) {
      user.value.avatar = response.data.data.avatar
    }
    
    return response.data
  }

  async function changePassword(oldPassword: string, newPassword: string) {
    return await axios.post('/api/v1/auth/change-password', { 
      oldPassword, 
      newPassword 
    })
  }

  async function forgotPassword(email: string) {
    return await axios.post('/api/v1/auth/forgot-password', { email })
  }

  async function resetPassword(token: string, newPassword: string) {
    return await axios.post('/api/v1/auth/reset-password', { 
      token, 
      newPassword 
    })
  }

  function logout() {
    clearAuth()
  }

  if (token.value) {
    fetchProfile()
  }

  return {
    user,
    token,
    isLoggedIn,
    login,
    register,
    logout,
    fetchProfile,
    updateProfile,
    uploadAvatar,
    changePassword,
    forgotPassword,
    resetPassword
  }
})
