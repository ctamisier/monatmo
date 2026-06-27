import { defineStore } from 'pinia'
import { ref, computed, onUnmounted } from 'vue'
import { i18n } from '../i18n'
import { setModuleState, fetchHomeStatus } from '../services/netatmo.service'
import { useHomeStore } from './home.store'

const SHUTTER_TYPES = ['NLV', 'NLLV', 'BNAS', 'BNAB', 'BNMS']
const GATEWAY_TYPES = ['NLG', 'BNS', 'BNMH']
const REFRESH_INTERVAL = 5000
const REFRESH_MAX_DURATION = 120000

type ShutterModule = {
  id: string
  type: string
  name?: string
  room_id?: string
  bridge?: string
  targetPosition: number | string
  currentPosition: number | string
  targetPositionStep?: number | string
  roomName: string
}

export const useShutterStore = defineStore('shutter', () => {
  const { t } = i18n.global
  const selectedModuleId = ref<string | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)
  const errorCount = ref(0)

  function setError(msg: string | null) {
    error.value = msg
    if (msg) errorCount.value++
  }
  const sending = ref(false)
  const statusMessage = ref<string | null>(null)

  let refreshTimer: ReturnType<typeof setInterval> | null = null
  let refreshTimeout: ReturnType<typeof setTimeout> | null = null

  const homeStore = useHomeStore()

  const shutterModules = computed<ShutterModule[]>(() => {
    const home = homeStore.selectedHome
    const status = homeStore.homeStatus
    if (!home || !status) return []

    return home.modules
      .filter((m) => SHUTTER_TYPES.includes(m.type))
      .map((m) => {
        const moduleStatus = status.modules.find((s) => s.id === m.id)
        const position = moduleStatus?.target_position ?? moduleStatus?.position ?? '--'
        const currentPosition = moduleStatus?.current_position ?? '--'
        const room = home.rooms.find((r) => r.id === m.room_id)

        return {
          id: m.id,
          type: m.type,
          name: m.name,
          room_id: m.room_id,
          bridge: m.bridge,
          targetPosition: position,
          currentPosition,
          targetPositionStep: moduleStatus?.['target_position:step'],
          roomName: room?.name ?? t('common.unknownRoom'),
        }
      })
  })

  const selectedModule = computed(() =>
    shutterModules.value.find((m) => m.id === selectedModuleId.value) ?? null,
  )

  function stopRefresh() {
    if (refreshTimer) {
      clearInterval(refreshTimer)
      refreshTimer = null
    }
    if (refreshTimeout) {
      clearTimeout(refreshTimeout)
      refreshTimeout = null
    }
  }

  function startRefresh() {
    stopRefresh()

    refreshTimer = setInterval(async () => {
      if (!homeStore.selectedHomeId) return
      try {
        const data = await fetchHomeStatus(homeStore.selectedHomeId)
        const newModules = data.body.home.modules
        if (homeStore.homeStatus) {
          for (const newMod of newModules) {
            const existing = homeStore.homeStatus.modules.find((m) => m.id === newMod.id)
            if (existing) {
              Object.assign(existing, newMod)
            }
          }
        }
      } catch {
        // silent
      }

      const modules = shutterModules.value
      const allStable = modules.every((m) => {
        if (m.targetPosition === '--' || m.currentPosition === '--') return true
        return m.currentPosition === m.targetPosition
      })

      if (allStable) {
        stopRefresh()
      }
    }, REFRESH_INTERVAL)

    refreshTimeout = setTimeout(() => {
      stopRefresh()
    }, REFRESH_MAX_DURATION)
  }

  function findBridgeId(): string | null {
    const home = homeStore.selectedHome
    const status = homeStore.homeStatus
    if (!home || !status) return null

    const gatewayStatus = status.modules.find((m) => GATEWAY_TYPES.includes(m.type))
    if (gatewayStatus) return gatewayStatus.id

    const gatewayModule = home.modules.find((m) => GATEWAY_TYPES.includes(m.type))
    if (gatewayModule) return gatewayModule.id

    return null
  }

  function selectModule(moduleId: string) {
    selectedModuleId.value = moduleId
    statusMessage.value = null
  }

  async function controlShutter(action: 'open' | 'close' | 'stop' | 'position', positionValue?: number, moduleId?: string) {
    const targetId = moduleId ?? selectedModuleId.value
    if (!targetId || !homeStore.selectedHomeId) {
      setError(t('errors.selectShutterFirst'))
      return
    }

    const ACTION_POSITIONS: Record<string, number> = {
      open: 100,
      close: 0,
      stop: -1,
    }

    if (action === 'position') {
      if (positionValue === undefined || isNaN(positionValue) || positionValue < 0 || positionValue > 100) {
        setError(t('errors.invalidPosition'))
        return
      }
    }

    const targetPosition = action === 'position'
      ? positionValue!
      : ACTION_POSITIONS[action]

    if (targetPosition === undefined) {
      setError(t('errors.unknownAction'))
      return
    }

    sending.value = true
    setError(null)

    try {
      const command: { id: string; target_position: number; bridge?: string } = {
        id: targetId,
        target_position: targetPosition,
      }

      const mod = shutterModules.value.find((m) => m.id === targetId)
      const bridgeId = mod?.bridge || findBridgeId()
      if (bridgeId) {
        command.bridge = bridgeId
      }

      await setModuleState(homeStore.selectedHomeId, [command])

      const actionLabels: Record<string, string> = {
        open: t('shutter.actionOpen'),
        close: t('shutter.actionClose'),
        stop: t('shutter.actionStop'),
        position: t('shutter.actionPosition', { position: targetPosition }),
      }
      statusMessage.value = t('shutter.commandSent', { action: actionLabels[action] || action })

      setTimeout(() => {
        statusMessage.value = null
      }, 3000)

      startRefresh()
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : t('errors.sendCommandError'))
      statusMessage.value = null
    } finally {
      sending.value = false
    }
  }

  function reset() {
    stopRefresh()
    selectedModuleId.value = null
    setError(null)
    statusMessage.value = null
  }

  onUnmounted(() => {
    stopRefresh()
  })

  return {
    selectedModuleId,
    loading,
    error,
    errorCount,
    sending,
    statusMessage,
    shutterModules,
    selectedModule,
    selectModule,
    controlShutter,
    reset,
  }
})
