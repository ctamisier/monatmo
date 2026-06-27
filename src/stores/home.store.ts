import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { i18n } from '../i18n'
import type { NetatmoHome, NetatmoHomeStatus } from '../types/netatmo'
import { fetchHomesData, fetchHomeStatus } from '../services/netatmo.service'

export const useHomeStore = defineStore('home', () => {
  const { t } = i18n.global
  const homes = ref<NetatmoHome[]>([])
  const selectedHomeId = ref<string | null>(null)
  const homeStatus = ref<NetatmoHomeStatus | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)
  const errorCount = ref(0)

  function setError(msg: string | null) {
    error.value = msg
    if (msg) errorCount.value++
  }

  const selectedHome = computed(() =>
    homes.value.find((h) => h.id === selectedHomeId.value) ?? null,
  )

  async function loadHomes() {
    loading.value = true
    setError(null)
    try {
      const data = await fetchHomesData()
      homes.value = data.body.homes
      if (homes.value.length > 0 && !selectedHomeId.value) {
        await selectHome(homes.value[0].id)
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : t('netatmo.unknownError'))
    } finally {
      loading.value = false
    }
  }

  async function selectHome(homeId: string) {
    selectedHomeId.value = homeId
    loading.value = true
    setError(null)
    try {
      const data = await fetchHomeStatus(homeId)
      homeStatus.value = data.body.home
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : t('netatmo.unknownError'))
    } finally {
      loading.value = false
    }
  }

  async function refreshHomeStatus() {
    if (!selectedHomeId.value) return
    try {
      const data = await fetchHomeStatus(selectedHomeId.value)
      homeStatus.value = data.body.home
    } catch {
      // silent — don't overwrite error state on background refresh
    }
  }

  function reset() {
    homes.value = []
    selectedHomeId.value = null
    homeStatus.value = null
    setError(null)
  }

  return {
    homes,
    selectedHomeId,
    homeStatus,
    loading,
    error,
    errorCount,
    selectedHome,
    loadHomes,
    selectHome,
    refreshHomeStatus,
    reset,
  }
})
