<script setup lang="ts">
import {computed, nextTick, onMounted, onUnmounted, ref, watch} from 'vue'
import {useI18n} from 'vue-i18n'
import {
  Chart,
  type Chart as ChartType,
  Filler,
  LinearScale,
  LineController,
  LineElement,
  PointElement,
  TimeScale,
  Tooltip,
} from 'chart.js'
import 'chartjs-adapter-date-fns'
import {useTemperatureStore, CHART_SCALES} from '../stores/temperature.store'
import type {ChartScale} from '../stores/temperature.store'
import {useHomeStore} from '../stores/home.store'
import {DAY_MS, SCALE_30MIN_MAX_DAYS, SCALE_1HOUR_MAX_DAYS} from '../constants/chart'
import ToastNotification from './ToastNotification.vue'

Chart.register(Tooltip, LineController, LineElement, PointElement, LinearScale, TimeScale, Filler)

const {t} = useI18n()
const tempStore = useTemperatureStore()
const homeStore = useHomeStore()
const chartCanvas = ref<HTMLCanvasElement | null>(null)
let chartInstance: ChartType | null = null
let dragStartX: number | null = null
let dragOverlay: HTMLElement | null = null

const chartData = computed(() => tempStore.chartDatasets)

const availableScales = computed(() => {
  let durationMs: number
  if (tempStore.dateBegin != null && tempStore.dateEnd != null) {
    durationMs = (tempStore.dateEnd - tempStore.dateBegin) * 1000
  } else {
    const allPoints = chartData.value.flatMap((d) => d.data)
    if (allPoints.length < 2) return CHART_SCALES
    durationMs = Math.max(...allPoints.map((p) => p.x)) - Math.min(...allPoints.map((p) => p.x))
  }
  return CHART_SCALES.filter((s) => {
    if (s.value === '30min') return durationMs < SCALE_30MIN_MAX_DAYS * DAY_MS
    if (s.value === '1hour') return durationMs < SCALE_1HOUR_MAX_DAYS * DAY_MS
    return true
  })
})

function getDisplayFormats(scale: ChartScale): Record<string, string> {
  const formats: Record<ChartScale, Record<string, string>> = {
    '30min': {minute: 'HH:mm'},
    '1hour': {minute: 'HH:mm'},
    '1day': {hour: 'dd/MM HH:mm'},
  }
  return formats[scale]
}

function setScale(scale: ChartScale) {
  tempStore.setScale(scale)
  tempStore.loadChartData()
}

function resetZoom() {
  tempStore.resetZoom()
}

function formatBattery(level?: number, state?: string): string {
  const labels: Record<string, string> = {
    very_low: t('temperature.batteryStates.very_low'),
    low: t('temperature.batteryStates.low'),
    medium: t('temperature.batteryStates.medium'),
    high: t('temperature.batteryStates.high'),
    full: t('temperature.batteryStates.full'),
  }
  const stateLabel = labels[state || ''] || state || '--'
  if (level !== undefined && level !== null) {
    return stateLabel !== '--' ? `${level}mV (${stateLabel})` : `${level}mV`
  }
  return stateLabel
}

function getRoomStatus(roomId: string) {
  return homeStore.homeStatus?.rooms.find((r) => r.id === roomId)
}

function renderChart() {
  if (!chartCanvas.value) return
  if (chartInstance) {
    chartInstance.destroy()
    chartInstance = null
  }

  if (chartData.value.length === 0) return

  const allPoints = chartData.value.flatMap((d) => d.data)
  if (allPoints.length === 0) return

  Chart.register({
    id: 'verticalLine',
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    afterDraw(chart: any) {
      if (chart.tooltip?._active?.length) {
        const ctx = chart.ctx
        const x = chart.tooltip._active[0].element.x
        const topY = chart.scales.y.top
        const bottomY = chart.scales.y.bottom

        ctx.save()
        ctx.beginPath()
        ctx.moveTo(x, topY)
        ctx.lineTo(x, bottomY)
        ctx.lineWidth = 1
        ctx.strokeStyle = '#999'
        ctx.stroke()
        ctx.restore()
      }
    },
  })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const tooltipPositioners = (Tooltip as any).positioners
  tooltipPositioners.verticalCursor = (_elements: unknown, eventPosition: { x: number; y: number }) => ({
    x: eventPosition.x,
    y: eventPosition.y - 15,
  })

  chartInstance = new Chart(chartCanvas.value, {
    type: 'line',
    data: {datasets: chartData.value},
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: {mode: 'index', intersect: false, axis: 'x'},
      scales: {
        x: {
          type: 'time',
          min: tempStore.dateBegin ? tempStore.dateBegin * 1000 : undefined,
          max: tempStore.dateEnd ? tempStore.dateEnd * 1000 : undefined,
          title: {display: true, text: t('temperature.chart.xAxis'), color: '#808c94'},
          time: {
            displayFormats: getDisplayFormats(tempStore.selectedScale),
          },
          ticks: {color: '#808c94'},
          grid: {display: false},
        },
        y: {
          type: 'linear',
          display: true,
          position: 'left',
          title: {display: true, text: t('temperature.chart.yAxis'), color: '#808c94'},
          min: Math.min(...allPoints.map((p) => p.y)) - 2,
          max: Math.max(...allPoints.map((p) => p.y)) + 2,
          ticks: {color: '#808c94'},
          grid: {color: 'rgba(0,0,0,0.05)'},
        },
      },
      plugins: {
        legend: {display: false},
        tooltip: {
          position: 'verticalCursor' as never,
          usePointStyle: true,
          callbacks: {
            label: (tooltipItem: { dataset: { label?: string }; parsed: { y: number | null } }) => {
              const value = tooltipItem.parsed.y
              return `${tooltipItem.dataset.label}: ${value?.toFixed(1) ?? '--'}°C`
            },
          },
        },
      },
    },
  })

  chartCanvas.value.removeEventListener('mousedown', onCanvasMouseDown)
  chartCanvas.value.addEventListener('mousedown', onCanvasMouseDown)
}

function getChartArea() {
  if (!chartInstance) return null
  return chartInstance.chartArea
}

function ensureDragOverlay() {
  if (!dragOverlay && chartCanvas.value) {
    dragOverlay = document.createElement('div')
    dragOverlay.style.cssText = 'position:absolute;top:0;height:100%;background:rgba(224,82,151,0.15);border:1px solid rgba(224,82,151,0.6);pointer-events:none;display:none;z-index:10;'
    const label = document.createElement('span')
    label.style.cssText = 'position:absolute;top:5%;left:50%;transform:translate(-50%,-50%);font-size:16px;font-weight:700;color:#e05297;white-space:nowrap;'
    dragOverlay.appendChild(label)
    chartCanvas.value.parentElement?.appendChild(dragOverlay)
  }
  return dragOverlay
}

function formatDragDuration(ms: number): string {
  const hours = ms / (3_600_000)
  if (hours < 24) {
    const n = Math.round(hours)
    return t('temperature.chart.dragDurationHours', n)
  }
  const days = Math.round(hours / 24)
  return t('temperature.chart.dragDuration', days)
}

function onCanvasMouseDown(e: MouseEvent) {
  const area = getChartArea()
  if (!area) return
  const rect = (e.target as HTMLCanvasElement).getBoundingClientRect()
  const x = e.clientX - rect.left
  if (x < area.left || x > area.right) return
  dragStartX = x
  const overlay = ensureDragOverlay()
  if (overlay) {
    overlay.style.display = 'block'
    overlay.style.left = `${x}px`
    overlay.style.width = '0px'
  }
  document.addEventListener('mousemove', onDocMouseMove)
  document.addEventListener('mouseup', onDocMouseUp)
}

function onDocMouseMove(e: MouseEvent) {
  if (dragStartX === null || !chartInstance) return
  const overlay = ensureDragOverlay()
  if (!overlay) return
  const rect = chartCanvas.value!.getBoundingClientRect()
  const area = getChartArea()!
  const x = Math.max(area.left, Math.min(e.clientX - rect.left, area.right))
  const left = Math.min(dragStartX, x)
  const width = Math.abs(x - dragStartX)
  overlay.style.left = `${left}px`
  overlay.style.width = `${width}px`

  const xScale = chartInstance.scales.x
  const minX = Math.min(dragStartX, x)
  const maxX = Math.max(dragStartX, x)
  const minTime = xScale.getValueForPixel(minX) as number
  const maxTime = xScale.getValueForPixel(maxX) as number
  const label = overlay.querySelector('span')
  if (label) {
    const duration = maxTime - minTime
    label.textContent = duration > 0 ? formatDragDuration(duration) : ''
  }
}

function onDocMouseUp(e: MouseEvent) {
  document.removeEventListener('mousemove', onDocMouseMove)
  document.removeEventListener('mouseup', onDocMouseUp)

  if (dragStartX === null || !chartInstance) return
  const overlay = ensureDragOverlay()
  if (overlay) overlay.style.display = 'none'

  const area = getChartArea()
  if (!area) { dragStartX = null; return }

  const rect = chartCanvas.value!.getBoundingClientRect()
  const endX = Math.max(area.left, Math.min(e.clientX - rect.left, area.right))

  if (Math.abs(endX - dragStartX) < 5) { dragStartX = null; return }

  const xScale = chartInstance.scales.x
  const minX = Math.min(dragStartX, endX)
  const maxX = Math.max(dragStartX, endX)
  const minTime = xScale.getValueForPixel(minX) as number
  const maxTime = xScale.getValueForPixel(maxX) as number

  dragStartX = null
  tempStore.zoomToDateRange(minTime, maxTime)
}

watch(() => tempStore.selectedRoomIds, () => {
  tempStore.loadChartData()
}, {deep: true})

watch(() => homeStore.homeStatus, () => {
  tempStore.reset()
})

watch(chartData, () => {
  nextTick(() => {
    renderChart()
  })
})

onMounted(() => {
  renderChart()
})

onUnmounted(() => {
  document.removeEventListener('mousemove', onDocMouseMove)
  document.removeEventListener('mouseup', onDocMouseUp)
  if (chartCanvas.value) {
    chartCanvas.value.removeEventListener('mousedown', onCanvasMouseDown)
  }
  if (dragOverlay) {
    dragOverlay.remove()
    dragOverlay = null
  }
  if (chartInstance) {
    chartInstance.destroy()
    chartInstance = null
  }
})
</script>

<template>
  <div class="card-custom">
    <div class="card-body">
      <h2 class="card-title">
        {{ t('temperature.title') }}
      </h2>

      <div
        v-if="tempStore.roomsWithThermostat.length === 0 && !tempStore.loading"
        class="opacity-60 text-sm"
      >
        {{ t('temperature.empty') }}
      </div>

      <div
        v-else
        class="grid grid-cols-[repeat(auto-fill,minmax(250px,1fr))] auto-rows-[1fr] gap-4"
      >
        <div
          v-for="room in tempStore.roomsWithThermostat"
          :key="room.id"
          class="card-custom card-inner"
          :class="
            tempStore.selectedRoomIds.includes(room.id)
              ? 'border-[#e05297]!'
              : ''
          "
          @click="tempStore.toggleRoomSelection(room.id)"
        >
          <div class="card-body">
            <h4 class="card-title">
              {{ room.name || t('temperature.fallbackRoom', {id: room.id}) }}
            </h4>

            <div class="flex items-center gap-3 mb-3">
              <!-- Bouton Flèche Bas (Moins) -->
              <button
                class="btn-temp-minus"
                @click.stop="tempStore.changeRoomTemperature(room.id, -0.5)"
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2.5"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                >
                  <path d="M6 9l6 6 6-6" />
                </svg>
              </button>

              <div class="text-xl font-mono text-[#e05297]">
                {{ getRoomStatus(room.id)?.therm_measured_temperature ?? '--' }}°C
              </div>

              <!-- Bouton Flèche Haut (Plus) -->
              <button
                class="btn-temp-plus"
                @click.stop="tempStore.changeRoomTemperature(room.id, 0.5)"
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2.5"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                >
                  <path d="M18 15l-6-6-6 6" />
                </svg>
              </button>
            </div>

            <div class="text-xs opacity-60 space-y-1">
              <div>
                {{ t('temperature.setpoint') }}
                <span class="text-[#e05297]">
                  {{ getRoomStatus(room.id)?.therm_setpoint_temperature ?? '--' }}°C
                </span>
              </div>
            </div>

            <div
              v-if="tempStore.getValveModulesForRoom(room.id).length > 0"
              class="mt-3 border-t border-[#1e1530] pt-3"
            >
              <div class="text-xs font-bold opacity-80 mb-2">
                {{ t('temperature.valves') }}
              </div>
              <div
                v-for="valve in tempStore.getValveModulesForRoom(room.id)"
                :key="valve.id"
                class="text-xs opacity-70 mb-1"
              >
                <div>{{ valve.name || `VALVE ${valve.id}` }}</div>
                <div>{{ t('temperature.battery') }} {{ formatBattery(valve.batteryLevel, valve.batteryState) }}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div
        v-show="tempStore.selectedRoomIds.length > 0"
        class="mt-6"
      >
        <div class="flex items-center justify-between mb-4">
          <h3 class="card-title">
            {{ t('temperature.chart.history') }}
          </h3>
          <div class="flex items-center gap-2">
            <button
              v-if="tempStore.dateBegin != null"
              class="btn btn-xs btn-ghost"
              @click="resetZoom"
            >
              {{ t('temperature.chart.resetZoom') }}
            </button>
            <div class="join">
              <button
                v-for="scale in availableScales"
                :key="scale.value"
                class="join-item btn btn-sm"
                :class="tempStore.selectedScale === scale.value ? 'btn-active btn-primary' : ''"
                @click="setScale(scale.value)"
              >
                {{ t(scale.i18nKey) }}
              </button>
            </div>
          </div>
        </div>
        <div
          v-show="chartData.length > 0"
          class="relative h-80"
        >
          <canvas
            ref="chartCanvas"
            class="cursor-crosshair"
          />
          <div
            v-if="tempStore.loading"
            class="absolute inset-0 flex items-center justify-center bg-base-100/60 z-20"
          >
            <span class="loading loading-spinner loading-lg text-[#e05297]" />
          </div>
        </div>
      </div>
    </div>
  </div>

  <ToastNotification
    v-if="tempStore.error"
    :key="tempStore.errorCount"
    :message="tempStore.error"
    type="error"
  />
</template>

<style scoped>
.btn-temp-minus {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  font-weight: 700;
  background: linear-gradient(135deg, rgba(244, 132, 95, 0.12), rgba(244, 132, 95, 0.04));
  border: 1px solid rgba(244, 132, 95, 0.25);
  color: #f4845f;
  transition: all 0.2s;
  cursor: pointer;
}

.btn-temp-minus:hover {
  transform: scale(1.1);
}

.btn-temp-minus:active {
  transform: scale(0.9);
}

.btn-temp-plus {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  font-weight: 700;
  background: linear-gradient(135deg, rgba(110, 220, 159, 0.12), rgba(110, 220, 159, 0.04));
  border: 1px solid rgba(110, 220, 159, 0.25);
  color: #6edc9f;
  transition: all 0.2s;
  cursor: pointer;
}

.btn-temp-plus:hover {
  transform: scale(1.1);
}

.btn-temp-plus:active {
  transform: scale(0.9);
}
</style>
