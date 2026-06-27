import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { i18n } from '../i18n'
import { setModuleState } from '../services/netatmo.service'
import { useHomeStore } from './home.store'
import { GATEWAY_TYPES } from '../constants/modules'

const LIGHT_TYPE = 'NLFN'

type LightModule = {
  id: string
  type: string
  name?: string
  room_id?: string
  isOn: boolean
  controllable: boolean
  roomName: string
}

export const useLightStore = defineStore('light', () => {
  const { t } = i18n.global
  const error = ref<string | null>(null)
  const errorCount = ref(0)

  function setError(msg: string | null) {
    error.value = msg
    if (msg) errorCount.value++
  }
  const pendingId = ref<string | null>(null)

  const homeStore = useHomeStore()

  const lightModules = computed<LightModule[]>(() => {
    const home = homeStore.selectedHome
    const status = homeStore.homeStatus
    if (!home || !status) return []

    return home.modules
      .filter((m) => m.type === LIGHT_TYPE)
      .map((m) => {
        const moduleStatus = status.modules.find((s) => s.id === m.id)
        const room = home.rooms.find((r) => r.id === m.room_id)

        return {
          id: m.id,
          type: m.type,
          name: m.name,
          room_id: m.room_id,
          isOn: moduleStatus?.on === true,
          controllable: moduleStatus?.on !== undefined,
          roomName: room?.name ?? t('common.unknownRoom'),
        }
      })
  })

  function findBridgeId(moduleId: string): string | null {
    const home = homeStore.selectedHome
    const status = homeStore.homeStatus
    if (!home || !status) return null

    const mod = home.modules.find((m) => m.id === moduleId)
    if (mod?.bridge) return mod.bridge

    const gatewayStatus = status.modules.find((m) => GATEWAY_TYPES.includes(m.type))
    if (gatewayStatus) return gatewayStatus.id

    const gatewayModule = home.modules.find((m) => GATEWAY_TYPES.includes(m.type))
    if (gatewayModule) return gatewayModule.id

    return null
  }

  async function controlLight(moduleId: string, on: boolean) {
    if (!homeStore.selectedHomeId) {
      setError(t('errors.selectHomeFirst'))
      return
    }

    pendingId.value = moduleId
    setError(null)

    try {
      const command: { id: string; on: boolean; bridge?: string } = {
        id: moduleId,
        on,
      }

      const bridgeId = findBridgeId(moduleId)
      if (bridgeId) {
        command.bridge = bridgeId
      }

      await setModuleState(homeStore.selectedHomeId, [command])

      const moduleStatus = homeStore.homeStatus?.modules.find((s) => s.id === moduleId)
      if (moduleStatus) {
        moduleStatus.on = on
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : t('errors.commandError'))
    } finally {
      pendingId.value = null
    }
  }

  function reset() {
    setError(null)
    pendingId.value = null
  }

  return {
    error,
    errorCount,
    pendingId,
    lightModules,
    controlLight,
    reset,
  }
})
