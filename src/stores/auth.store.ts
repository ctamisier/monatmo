import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { AuthConfig, TokenData } from '../types/auth'
import { loadConfig, saveConfig, getValidToken, handleCallback, startAuth, clearLocalStorage as clearStorage, removeToken, getRefreshedToken } from '../services/auth.service'
import { useHomeStore } from './home.store'

const PROACTIVE_REFRESH_SECONDS = 10 * 60

export const useAuthStore = defineStore('auth', () => {
  const config = ref<AuthConfig>(loadConfig())
  const token = ref<TokenData | null>(getValidToken())

  const isAuthenticated = computed(() => token.value !== null)
  const canConnect = computed(() => config.value.clientId.length > 0)

  function updateConfig(partial: Partial<AuthConfig>) {
    config.value = { ...config.value, ...partial }
    saveConfig(config.value)
  }

  function connect() {
    startAuth(config.value)
  }

  async function processCallback() {
    const result = await handleCallback()
    if (result) {
      token.value = result
    }
    return token.value
  }

  async function checkExistingToken() {
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
  }

  function logout() {
    removeToken()
    token.value = null
    useHomeStore().reset()
  }

  function clearConfig() {
    clearStorage()
    config.value = loadConfig()
    token.value = null
    useHomeStore().reset()
  }

  return {
    config,
    token,
    isAuthenticated,
    canConnect,
    updateConfig,
    connect,
    processCallback,
    checkExistingToken,
    logout,
    clearConfig,
  }
})
