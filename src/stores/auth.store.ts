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
  const isInitialized = ref(false)

  const isAuthenticated = computed(() => token.value !== null)
  const canConnect = computed(() => config.value !== null)

  async function init(): Promise<void> {
    try {
      config.value = await fetchConfig()
    } catch (e: unknown) {
      console.error('Config fetch error:', e)
      config.value = null
    }
  }

  function connect(): void {
    if (!config.value) return
    startAuth(config.value)
  }

  async function processCallback(): Promise<TokenData | null> {
    try {
      const result = await handleCallback()
      if (result) {
        token.value = result
      }
      return result
    } catch (e: unknown) {
      console.error('Callback processing error:', e)
      return null
    }
  }

  async function checkExistingToken(): Promise<TokenData | null> {
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

  async function initialize(): Promise<boolean> {
    const configPromise = init()

    const callbackToken = await processCallback()
    await checkExistingToken()

    if (!isAuthenticated.value) {
      await configPromise
    }

    isInitialized.value = true
    return callbackToken !== null
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
    isInitialized,
    init,
    connect,
    processCallback,
    checkExistingToken,
    initialize,
    logout,
  }
})
