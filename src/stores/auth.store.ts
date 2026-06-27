import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { TokenData } from '../types/auth'
import type { ServerConfig } from '../services/auth.service'
import { fetchConfig, getValidToken, handleCallback, startAuth, removeToken, getRefreshedToken } from '../services/auth.service'
import { useHomeStore } from './home.store'

const PROACTIVE_REFRESH_SECONDS = 10 * 60

export const useAuthStore = defineStore('auth', () => {
  const config = ref<ServerConfig | null>(null)
  const token = ref<TokenData | null>(getValidToken())

  const isAuthenticated = computed(() => token.value !== null)
  const canConnect = computed(() => config.value !== null)

  async function init() {
    try {
      config.value = await fetchConfig()
    } catch (e: unknown) {
      console.error('Config fetch error:', e)
      config.value = null
    }
  }

  function connect() {
    if (!config.value) return
    startAuth(config.value)
  }

  async function processCallback() {
    try {
      const result = await handleCallback()
      if (result) {
        token.value = result
      }
      return token.value
    } catch (e: unknown) {
      console.error('Callback processing error:', e)
      return null
    }
  }

  async function checkExistingToken() {
    try {
      const currentToken = getValidToken()
      if (currentToken) {
        token.value = currentToken
        const expiresIn = (currentToken.timestamp + currentToken.expires_in * 1000) - Date.now()
        if (expiresIn < PROACTIVE_REFRESH_SECONDS * 1000) {
          const refreshed = await getRefreshedToken()
          if (refreshed) token.value = refreshed
        }
      } else {
        const refreshed = await getRefreshedToken()
        if (refreshed) token.value = refreshed
      }
      return token.value
    } catch (e: unknown) {
      console.error('Token check error:', e)
      return null
    }
  }

  function logout() {
    removeToken()
    token.value = null
    useHomeStore().reset()
  }

  return {
    config,
    token,
    isAuthenticated,
    canConnect,
    init,
    connect,
    processCallback,
    checkExistingToken,
    logout,
  }
})
