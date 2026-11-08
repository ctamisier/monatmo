import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { i18n } from '../i18n'
import { fetchRoomMeasure, setRoomThermpoint } from '../services/netatmo.service'
import { fetchTemperatureForecast, fetchTemperatureArchive, isWithinForecastRange, toDateString } from '../services/openmeteo.service'
import { useHomeStore } from './home.store'
import {
  CHART_COLORS,
  DAY_MS,
  DEFAULT_RANGE_DAYS,
  DEFAULT_TEMPERATURE,
  OUTDOOR_DATASET_ID,
  SCALE_1HOUR_MAX_DAYS,
  SCALE_30MIN_MAX_DAYS,
  TOOLTIP_CURSOR_COLOR,
} from '../constants/chart'
import type { NetatmoHome, RoomMeasure } from '../types/netatmo'
import type { ChartScale, ChartScaleOption, TemperatureDataset, TemperaturePoint, TemperatureValve } from '../types/temperature'

const CHART_SCALES: readonly ChartScaleOption[] = [
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
  const chartDatasets = ref<TemperatureDataset[]>([])
  const { t } = i18n.global

  const homeStore = useHomeStore()

  // Chaque chargement prend un identifiant : seule la réponse la plus récente
  // est appliquée, ce qui évite les résultats croisés quand l'utilisateur
  // enchaîne les zooms ou les changements d'échelle.
  let chartRequestId = 0

  function setError(message: string | null): void {
    error.value = message
    if (message) errorCount.value += 1
  }

  const availableScales = computed<readonly ChartScaleOption[]>(() => {
    let durationMs: number

    if (dateBegin.value != null && dateEnd.value != null) {
      durationMs = (dateEnd.value - dateBegin.value) * 1000
    } else {
      const bounds = getTimeBounds(chartDatasets.value.flatMap((dataset) => dataset.data))
      if (!bounds) return CHART_SCALES
      durationMs = bounds.max - bounds.min
    }

    return CHART_SCALES.filter((scale) => {
      if (scale.value === '30min') return durationMs < SCALE_30MIN_MAX_DAYS * DAY_MS
      if (scale.value === '1hour') return durationMs < SCALE_1HOUR_MAX_DAYS * DAY_MS
      return true
    })
  })

  const thermostatRoomIds = computed(() => new Set(
    (homeStore.homeStatus?.rooms ?? [])
      .filter((room) => room.therm_measured_temperature !== undefined)
      .map((room) => room.id),
  ))

  const displayRooms = computed(() => {
    const home = homeStore.selectedHome
    const status = homeStore.homeStatus
    if (!home || !status?.rooms || !status.modules) return []

    return home.rooms.filter((room) => {
      const hasValve = home.modules.some((module) => module.room_id === room.id && module.type === 'NRV')
      return thermostatRoomIds.value.has(room.id) || hasValve
    })
  })

  function getTimeBounds(points: readonly TemperaturePoint[]): { min: number; max: number } | null {
    if (points.length === 0) return null

    let min = points[0].x
    let max = min
    for (const point of points) {
      if (point.x < min) min = point.x
      if (point.x > max) max = point.x
    }
    return { min, max }
  }

  function pickScaleForDuration(durationMs: number): ChartScale {
    if (durationMs < SCALE_30MIN_MAX_DAYS * DAY_MS) return '30min'
    if (durationMs < SCALE_1HOUR_MAX_DAYS * DAY_MS) return '1hour'
    return '1day'
  }

  function parseMeasures(measures: RoomMeasure[]): TemperaturePoint[] {
    const points: TemperaturePoint[] = []

    for (const measure of measures) {
      const beginTime = measure.beg_time * 1000
      const stepTime = measure.step_time * 1000

      if (measure.value && measure.value.length > 0) {
        measure.value.forEach((entry, index) => {
          const value = Array.isArray(entry) ? entry[0] : entry
          if (value !== undefined) {
            points.push({ x: beginTime + index * stepTime, y: value })
          }
        })
      } else if (measure.values && measure.values.length > 0) {
        measure.values.forEach((entry, index) => {
          if (entry.value !== undefined) {
            points.push({ x: beginTime + index * stepTime, y: entry.value })
          }
        })
      }
    }

    return points
  }

  function normalizeBody(body: unknown): RoomMeasure[] {
    if (Array.isArray(body)) return body
    if (body && typeof body === 'object') {
      const record = body as Record<string, unknown>
      if ('home' in record && record.home) return [record.home as RoomMeasure]
      if ('beg_time' in record || 'value' in record) return [record as RoomMeasure]
    }
    return []
  }

  async function buildRoomDatasets(): Promise<TemperatureDataset[]> {
    const homeId = homeStore.selectedHomeId
    const home = homeStore.selectedHome
    if (!homeId || !home) return []

    const scale = selectedScale.value
    const requests = selectedRoomIds.value.map(async (roomId, index): Promise<TemperatureDataset | null> => {
      const response = await fetchRoomMeasure(homeId, roomId, scale, 'temperature', dateBegin.value, dateEnd.value)
      const data = parseMeasures(normalizeBody(response.body))

      if (data.length === 0) return null

      const room = home.rooms.find((candidate) => candidate.id === roomId)
      const color = CHART_COLORS[index % CHART_COLORS.length]
      return {
        id: roomId,
        label: room?.name || roomId,
        data,
        borderColor: color,
        pointBackgroundColor: color,
      } satisfies TemperatureDataset
    })

    const datasets = await Promise.all(requests)
    return datasets.filter((dataset): dataset is TemperatureDataset => dataset !== null)
  }

  function findClosestPoint(sortedPoints: readonly TemperaturePoint[], targetX: number): TemperaturePoint {
    let low = 0
    let high = sortedPoints.length - 1

    while (low < high) {
      const middle = (low + high) >> 1
      if (sortedPoints[middle].x < targetX) low = middle + 1
      else high = middle
    }

    const after = sortedPoints[low]
    const before = sortedPoints[low - 1]
    if (!before) return after

    return Math.abs(after.x - targetX) < Math.abs(before.x - targetX) ? after : before
  }

  function alignOutdoorToRoomTimestamps(
    roomPoints: readonly TemperaturePoint[],
    outdoorPoints: readonly TemperaturePoint[],
  ): TemperaturePoint[] {
    const sortedOutdoor = [...outdoorPoints].sort((a, b) => a.x - b.x)
    const timestamps = [...new Set(roomPoints.map((point) => point.x))].sort((a, b) => a - b)
    return timestamps.map((timestamp) => ({
      x: timestamp,
      y: findClosestPoint(sortedOutdoor, timestamp).y,
    }))
  }

  async function buildOutdoorDataset(roomDatasets: readonly TemperatureDataset[]): Promise<TemperatureDataset | null> {    const home: NetatmoHome | null = homeStore.selectedHome
    if (!home?.coordinates) return null

    const [lon, lat] = home.coordinates
    const roomPoints = roomDatasets.flatMap((dataset) => dataset.data)
    const bounds = getTimeBounds(roomPoints)

    let startMs: number
    let endMs: number

    if (dateBegin.value != null && dateEnd.value != null) {
      startMs = dateBegin.value * 1000
      endMs = dateEnd.value * 1000
    } else if (bounds) {
      startMs = bounds.min
      endMs = bounds.max
    } else {
      endMs = Date.now()
      startMs = endMs - DEFAULT_RANGE_DAYS * DAY_MS
    }

    const startDate = toDateString(startMs)
    const endDate = toDateString(endMs)
    const fetcher = isWithinForecastRange(startDate) ? fetchTemperatureForecast : fetchTemperatureArchive
    const response = await fetcher(lat, lon, startDate, endDate)

    const outdoorPoints: TemperaturePoint[] = []
    response.hourly.time.forEach((timestamp, index) => {
      const temperature = response.hourly.temperature_2m[index]
      if (temperature != null) {
        outdoorPoints.push({ x: timestamp * 1000, y: temperature })
      }
    })
    if (outdoorPoints.length < 2) return null

    const data = roomPoints.length > 0
      ? alignOutdoorToRoomTimestamps(roomPoints, outdoorPoints)
      : outdoorPoints
    if (data.length === 0) return null

    return {
      id: OUTDOOR_DATASET_ID,
      label: OUTDOOR_DATASET_ID,
      data,
      borderColor: TOOLTIP_CURSOR_COLOR,
      pointBackgroundColor: TOOLTIP_CURSOR_COLOR,
    }
  }

  async function loadOutdoorDataset(roomDatasets: readonly TemperatureDataset[]): Promise<TemperatureDataset | null> {
    try {
      return await buildOutdoorDataset(roomDatasets)
    } catch (e: unknown) {
      // La météo extérieure est un bonus : son échec ne doit pas masquer les
      // courbes des pièces.
      console.error('Outdoor temperature data error:', e)
      return null
    }
  }

  async function refreshChartData(): Promise<void> {
    const requestId = ++chartRequestId
    loading.value = true
    setError(null)

    try {
      const roomDatasets = await buildRoomDatasets()
      if (requestId !== chartRequestId) return

      const outdoorDataset = await loadOutdoorDataset(roomDatasets)
      if (requestId !== chartRequestId) return

      // Une seule publication : le graphe n'est reconstruit qu'une fois par
      // chargement, au lieu d'apparaître sans puis avec la courbe extérieure.
      chartDatasets.value = outdoorDataset ? [...roomDatasets, outdoorDataset] : roomDatasets
    } catch (e: unknown) {
      if (requestId === chartRequestId) {
        setError(e instanceof Error ? e.message : t('errors.loadingData'))
      }
    } finally {
      if (requestId === chartRequestId) loading.value = false
    }
  }

  async function setScale(scale: ChartScale): Promise<void> {
    selectedScale.value = scale
    await refreshChartData()
  }

  async function zoomToDateRange(minX: number, maxX: number): Promise<void> {
    const duration = maxX - minX
    if (duration <= 0) return

    selectedScale.value = pickScaleForDuration(duration)
    dateBegin.value = Math.floor(minX / 1000)
    dateEnd.value = Math.floor(maxX / 1000)
    await refreshChartData()
  }

  async function resetZoom(): Promise<void> {
    dateBegin.value = undefined
    dateEnd.value = undefined
    selectedScale.value = '1day'
    await refreshChartData()
  }

  async function toggleRoomSelection(roomId: string): Promise<void> {
    const index = selectedRoomIds.value.indexOf(roomId)
    if (index > -1) selectedRoomIds.value.splice(index, 1)
    else selectedRoomIds.value.push(roomId)

    await refreshChartData()
  }

  async function changeRoomTemperature(roomId: string, delta: number): Promise<void> {
    const status = homeStore.homeStatus
    if (!status || !homeStore.selectedHomeId) return

    const roomStatus = status.rooms?.find((room) => room.id === roomId)
    const currentTemperature = roomStatus?.therm_setpoint_temperature ?? DEFAULT_TEMPERATURE
    const nextTemperature = Math.round((currentTemperature + delta) * 2) / 2

    try {
      await setRoomThermpoint(homeStore.selectedHomeId, roomId, 'manual', nextTemperature)
      if (roomStatus) {
        roomStatus.therm_setpoint_temperature = nextTemperature
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : t('errors.updateError'))
    }
  }

  function getValveModulesForRoom(roomId: string): TemperatureValve[] {
    const home = homeStore.selectedHome
    const status = homeStore.homeStatus
    if (!home || !status) return []

    return (home.modules ?? [])
      .filter((module) => module.room_id === roomId && module.type === 'NRV')
      .map((module) => {
        const moduleStatus = status.modules?.find((candidate) => candidate.id === module.id)
        return {
          id: module.id,
          name: module.name,
          batteryLevel: moduleStatus?.battery_level ?? module.battery_level,
          batteryState: moduleStatus?.battery_state || module.battery_state || '--',
        }
      })
  }

  function reset(): void {
    chartRequestId += 1
    selectedRoomIds.value = []
    selectedScale.value = '1day'
    dateBegin.value = undefined
    dateEnd.value = undefined
    chartDatasets.value = []
    loading.value = false
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
    availableScales,
    thermostatRoomIds,
    displayRooms,
    refreshChartData,
    setScale,
    zoomToDateRange,
    resetZoom,
    toggleRoomSelection,
    changeRoomTemperature,
    getValveModulesForRoom,
    reset,
  }
})
