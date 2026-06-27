import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { i18n } from '../i18n'
import { fetchRoomMeasure, setRoomThermpoint } from '../services/netatmo.service'
import { fetchTemperatureForecast, fetchTemperatureArchive, isWithinForecastRange, toDateString } from '../services/openmeteo.service'
import { useHomeStore } from './home.store'
import { DAY_MS, SCALE_30MIN_MAX_DAYS, SCALE_1HOUR_MAX_DAYS, DEFAULT_TEMPERATURE, DEFAULT_RANGE_DAYS, TOOLTIP_CURSOR_COLOR } from '../constants/chart'
import type { RoomMeasure } from '../types/netatmo'

const CHART_COLORS = [
  '#f4845f', '#e05297', '#7b5ea7', '#f0c040', '#c97bdb',
  '#d9735a', '#b06ab3', '#8e6cb5', '#e8956d', '#a678c2',
  '#6edc9f', '#4ecdc4', '#45b7d1', '#96e6a1', '#dda0dd',
  '#ff9a9e', '#fad0c4', '#ffecd2', '#fcb69f', '#ffeaa7',
]

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
  const chartDatasets = ref<{ label: string; data: { x: number; y: number }[]; borderColor: string; pointBackgroundColor: string; borderDash?: number[] }[]>([])

  const homeStore = useHomeStore()

  const availableScales = computed(() => {
    let durationMs: number
    if (dateBegin.value != null && dateEnd.value != null) {
      durationMs = (dateEnd.value - dateBegin.value) * 1000
    } else {
      const allPoints = chartDatasets.value.flatMap((d) => d.data)
      if (allPoints.length < 2) return CHART_SCALES
      durationMs = Math.max(...allPoints.map((p) => p.x)) - Math.min(...allPoints.map((p) => p.x))
    }
    return CHART_SCALES.filter((s) => {
      if (s.value === '30min') return durationMs < SCALE_30MIN_MAX_DAYS * DAY_MS
      if (s.value === '1hour') return durationMs < SCALE_1HOUR_MAX_DAYS * DAY_MS
      return true
    })
  })

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

  async function zoomToDateRange(minX: number, maxX: number) {
    const duration = maxX - minX
    if (duration <= 0) return
    selectedScale.value = pickScaleForDuration(duration)
    dateBegin.value = Math.floor(minX / 1000)
    dateEnd.value = Math.floor(maxX / 1000)
    await loadChartData()
    await loadOutdoorChartData()
  }

  async function resetZoom() {
    dateBegin.value = undefined
    dateEnd.value = undefined
    selectedScale.value = '1day'
    await loadChartData()
    await loadOutdoorChartData()
  }

  function toggleRoomSelection(roomId: string) {
    const index = selectedRoomIds.value.indexOf(roomId)
    if (index > -1) {
      selectedRoomIds.value.splice(index, 1)
    } else {
      selectedRoomIds.value.push(roomId)
    }
  }

  function parseMeasures(measures: RoomMeasure[]): { x: number; y: number }[] {
    const points: { x: number; y: number }[] = []

    for (const measure of measures) {
      const begTime = measure.beg_time * 1000
      const stepTime = measure.step_time * 1000

      if (measure.value && measure.value.length > 0) {
        measure.value.forEach((entry, index) => {
          const tempValue = Array.isArray(entry) ? entry[0] : entry
          if (tempValue !== undefined) {
            points.push({ x: begTime + index * stepTime, y: tempValue })
          }
        })
      } else if (measure.values && measure.values.length > 0) {
        measure.values.forEach((entry, index) => {
          if (entry.value !== undefined) {
            points.push({ x: begTime + index * stepTime, y: entry.value })
          }
        })
      }
    }

    return points
  }

  function normalizeBody(body: unknown): RoomMeasure[] {
    if (Array.isArray(body)) return body
    if (body && typeof body === 'object') {
      const obj = body as Record<string, unknown>
      if ('home' in obj && obj.home) return [obj.home as RoomMeasure]
      if ('beg_time' in obj || 'value' in obj) return [obj as RoomMeasure]
    }
    return []
  }

  async function loadChartData() {
    loading.value = true
    setError(null)

    try {
      const home = homeStore.selectedHome
      const scale = selectedScale.value
      const datasets: { label: string; data: { x: number; y: number }[]; borderColor: string; pointBackgroundColor: string; borderDash?: number[] }[] = []

      for (let i = 0; i < selectedRoomIds.value.length; i++) {
        const roomId = selectedRoomIds.value[i]
        const room = home?.rooms.find((r) => r.id === roomId)

        const homeId = homeStore.selectedHomeId
        if (!homeId) continue

        const response = await fetchRoomMeasure(
          homeId,
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
    const currentTemp = roomStatus?.therm_setpoint_temperature ?? DEFAULT_TEMPERATURE
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

  let outdoorLoading = false

  async function loadOutdoorChartData() {
    if (outdoorLoading) return
    outdoorLoading = true

    const home = homeStore.selectedHome
    if (!home?.coordinates) {
      outdoorLoading = false
      return
    }

    loading.value = true
    const lon = home.coordinates[0]
    const lat = home.coordinates[1]

    const allRoomPoints = chartDatasets.value.flatMap((d) => d.data)

    let startMs: number
    let endMs: number

    if (dateBegin.value != null && dateEnd.value != null) {
      startMs = dateBegin.value * 1000
      endMs = dateEnd.value * 1000
    } else if (allRoomPoints.length > 0) {
      startMs = Math.min(...allRoomPoints.map((p) => p.x))
      endMs = Math.max(...allRoomPoints.map((p) => p.x))
    } else {
      const now = Date.now()
      startMs = now - DEFAULT_RANGE_DAYS * DAY_MS
      endMs = now
    }

    try {
      const startStr = toDateString(startMs)
      const endStr = toDateString(endMs)
      const fetcher = isWithinForecastRange(startStr) ? fetchTemperatureForecast : fetchTemperatureArchive
      const response = await fetcher(
        lat,
        lon,
        startStr,
        endStr,
      )

      const { time, temperature_2m } = response.hourly
      const outdoorPoints: { x: number; y: number }[] = []
      for (let i = 0; i < time.length; i++) {
        const temp = temperature_2m[i]
        if (temp != null) {
          outdoorPoints.push({ x: time[i] * 1000, y: temp })
        }
      }

      if (outdoorPoints.length < 2) return

      let data: { x: number; y: number }[]

      if (allRoomPoints.length > 0) {
        const roomTimestamps = [...new Set(allRoomPoints.map((p) => p.x))]
          .sort((a, b) => a - b)
        data = roomTimestamps.map((ts) => {
          let best = outdoorPoints[0]
          for (const p of outdoorPoints) {
            if (Math.abs(p.x - ts) < Math.abs(best.x - ts)) best = p
          }
          return { x: ts, y: best.y }
        })
      } else {
        data = outdoorPoints
      }

      if (data.length > 0) {
        const outdoorColor = TOOLTIP_CURSOR_COLOR
        const outdoorLabel = t('temperature.chart.outdoorLabel')
        chartDatasets.value = [
          ...chartDatasets.value.filter((d) => d.label !== outdoorLabel),
          {
            label: outdoorLabel,
            data,
            borderColor: outdoorColor,
            pointBackgroundColor: outdoorColor,
          },
        ]
      }
    } catch (e: unknown) {
      console.error('Outdoor temperature data error:', e)
    } finally {
      outdoorLoading = false
      loading.value = false
    }
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
    availableScales,
    roomsWithThermostat,
    toggleRoomSelection,
    setScale,
    zoomToDateRange,
    resetZoom,
    loadChartData,
    loadOutdoorChartData,
    changeRoomTemperature,
    getValveModulesForRoom,
    reset,
  }
})
