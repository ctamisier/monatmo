import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { i18n } from '../i18n'
import { fetchRoomMeasure, setRoomThermpoint } from '../services/netatmo.service'
import { useHomeStore } from './home.store'
import { DAY_MS, SCALE_30MIN_MAX_DAYS, SCALE_1HOUR_MAX_DAYS } from '../constants/chart'

const CHART_COLORS = [
  '#f4845f', '#e05297', '#7b5ea7', '#f0c040', '#c97bdb',
  '#d9735a', '#b06ab3', '#8e6cb5', '#e8956d', '#a678c2',
  '#6edc9f', '#4ecdc4', '#45b7d1', '#96e6a1', '#dda0dd',
  '#ff9a9e', '#fad0c4', '#ffecd2', '#fcb69f', '#ffeaa7',
]

type MeasureEntry = {
  beg_time: number
  step_time: number
  value?: (number | number[])[]
  values?: { value: number }[]
}

export type ChartScale = '30min' | '1hour' | '1day'

export const CHART_SCALES: { value: ChartScale; i18nKey: string }[] = [
  { value: '30min', i18nKey: 'temperature.chart.scales.30min' },
  { value: '1hour', i18nKey: 'temperature.chart.scales.1hour' },
  { value: '1day', i18nKey: 'temperature.chart.scales.1day' },
]

export const useTemperatureStore = defineStore('temperature', () => {
  const selectedRoomIds = ref<string[]>([])
  const selectedScale = ref<ChartScale>('1day')
  const dateBegin = ref<number | undefined>(undefined)
  const dateEnd = ref<number | undefined>(undefined)
  const loading = ref(false)
  const error = ref<string | null>(null)
  const errorCount = ref(0)
  const { t } = i18n.global

  function setError(msg: string | null) {
    error.value = msg
    if (msg) errorCount.value++
  }
  const chartDatasets = ref<{ label: string; data: { x: number; y: number }[]; borderColor: string; pointBackgroundColor: string }[]>([])

  const homeStore = useHomeStore()

  const roomsWithThermostat = computed(() => {
    const home = homeStore.selectedHome
    const status = homeStore.homeStatus
    if (!home || !status) return []

    return home.rooms.filter((room) => {
      const roomStatus = status.rooms.find((r) => r.id === room.id)
      return roomStatus?.therm_measured_temperature !== undefined
    })
  })

  function setScale(scale: ChartScale) {
    selectedScale.value = scale
  }

  function pickScaleForDuration(durationMs: number): ChartScale {
    if (durationMs < SCALE_30MIN_MAX_DAYS * DAY_MS) return '30min'
    if (durationMs < SCALE_1HOUR_MAX_DAYS * DAY_MS) return '1hour'
    return '1day'
  }

  function zoomToDateRange(minX: number, maxX: number) {
    const duration = maxX - minX
    if (duration <= 0) return
    selectedScale.value = pickScaleForDuration(duration)
    dateBegin.value = Math.floor(minX / 1000)
    dateEnd.value = Math.floor(maxX / 1000)
    loadChartData()
  }

  function resetZoom() {
    dateBegin.value = undefined
    dateEnd.value = undefined
    selectedScale.value = '1day'
    loadChartData()
  }

  function toggleRoomSelection(roomId: string) {
    const index = selectedRoomIds.value.indexOf(roomId)
    if (index > -1) {
      selectedRoomIds.value.splice(index, 1)
    } else {
      selectedRoomIds.value.push(roomId)
    }
  }

  function parseMeasures(measures: MeasureEntry[]): { x: number; y: number }[] {
    const points: { x: number; y: number }[] = []

    for (const measure of measures) {
      const begTime = measure.beg_time * 1000
      const stepTime = measure.step_time * 1000

      if (measure.value && measure.value.length > 0) {
        measure.value.forEach((entry, index) => {
          const tempValue = Array.isArray(entry) ? entry[0] : entry
          points.push({ x: begTime + index * stepTime, y: tempValue })
        })
      } else if (measure.values && measure.values.length > 0) {
        measure.values.forEach((entry, index) => {
          points.push({ x: begTime + index * stepTime, y: entry.value })
        })
      }
    }

    return points
  }

  function normalizeBody(body: unknown): MeasureEntry[] {
    if (Array.isArray(body)) return body
    if (body && typeof body === 'object') {
      const obj = body as Record<string, unknown>
      if ('home' in obj && obj.home) return [obj.home as MeasureEntry]
      if ('beg_time' in obj || 'value' in obj) return [obj as MeasureEntry]
    }
    return []
  }

  async function loadChartData() {
    if (selectedRoomIds.value.length === 0) {
      chartDatasets.value = []
      return
    }

    loading.value = true
    setError(null)

    try {
      const home = homeStore.selectedHome
      const scale = selectedScale.value
      const datasets: { label: string; data: { x: number; y: number }[]; borderColor: string; pointBackgroundColor: string }[] = []

      for (let i = 0; i < selectedRoomIds.value.length; i++) {
        const roomId = selectedRoomIds.value[i]
        const room = home?.rooms.find((r) => r.id === roomId)

        const response = await fetchRoomMeasure(
          homeStore.selectedHomeId!,
          roomId,
          scale,
          'temperature',
          dateBegin.value,
          dateEnd.value,
        )

        const measures = normalizeBody(response.body)
        const data = parseMeasures(measures)

        if (data.length > 0) {
          const color = CHART_COLORS[i % CHART_COLORS.length]
          datasets.push({
            label: room?.name || roomId,
            data,
            borderColor: color,
            pointBackgroundColor: color,
          })
        }
      }

      chartDatasets.value = datasets
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : t('errors.loadingData'))
    } finally {
      loading.value = false
    }
  }

  async function changeRoomTemperature(roomId: string, delta: number) {
    const status = homeStore.homeStatus
    if (!status || !homeStore.selectedHomeId) return

    const roomStatus = status.rooms.find((r) => r.id === roomId)
    const currentTemp = roomStatus?.therm_setpoint_temperature ?? 20
    const newTemp = Math.round((currentTemp + delta) * 2) / 2

    try {
      await setRoomThermpoint(homeStore.selectedHomeId, roomId, 'manual', newTemp)
      if (roomStatus) {
        roomStatus.therm_setpoint_temperature = newTemp
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : t('errors.updateError'))
    }
  }

  function getValveModulesForRoom(roomId: string) {
    const home = homeStore.selectedHome
    const status = homeStore.homeStatus
    if (!home || !status) return []

    return (home.modules || [])
      .filter((module) => module.room_id === roomId && module.type === 'NRV')
      .map((module) => {
        const moduleStatus = status.modules.find((s) => s.id === module.id)
        return {
          ...module,
          batteryLevel: moduleStatus?.battery_level ?? module.battery_level,
          batteryState: moduleStatus?.battery_state || module.battery_state || '--',
        }
      })
  }

  function reset() {
    selectedRoomIds.value = []
    selectedScale.value = '1day'
    dateBegin.value = undefined
    dateEnd.value = undefined
    setError(null)
  }

  return {
    selectedRoomIds,
    selectedScale,
    dateBegin,
    dateEnd,
    loading,
    error,
    errorCount,
    chartDatasets,
    homeStatus: homeStore.homeStatus,
    roomsWithThermostat,
    toggleRoomSelection,
    setScale,
    zoomToDateRange,
    resetZoom,
    loadChartData,
    changeRoomTemperature,
    getValveModulesForRoom,
    reset,
  }
})
