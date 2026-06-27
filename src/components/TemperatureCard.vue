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
import {useTemperatureStore} from '../stores/temperature.store'
import type {ChartScale} from '../stores/temperature.store'
import {useHomeStore} from '../stores/home.store'
import {GRID_LINE_COLOR, CROSSHAIR_COLOR, TOOLTIP_CURSOR_COLOR, TOOLTIP_OFFSET_Y, TOOLTIP_PADDING, TOOLTIP_BODY_SPACING, TOOLTIP_BOX_SIZE, TOOLTIP_BOX_PADDING, TOOLTIP_TITLE_MARGIN_BOTTOM, CHART_PADDING, DRAG_THRESHOLD} from '../constants/chart'
import ToastNotification from './ToastNotification.vue'
import IconArrowDown from './icons/IconArrowDown.vue'
import IconArrowUp from './icons/IconArrowUp.vue'

Chart.register(Tooltip, LineController, LineElement, PointElement, LinearScale, TimeScale, Filler)

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
      ctx.strokeStyle = CROSSHAIR_COLOR
      ctx.stroke()
      ctx.restore()
    }
  },
})

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const tooltipPositioners = (Tooltip as any).positioners
tooltipPositioners.verticalCursor = (_elements: unknown, eventPosition: { x: number; y: number }) => ({
  x: eventPosition.x,
  y: eventPosition.y - TOOLTIP_OFFSET_Y,
})

const {t, locale} = useI18n()
const tempStore = useTemperatureStore()
const homeStore = useHomeStore()
const chartCanvas = ref<HTMLCanvasElement | null>(null)
let chartInstance: ChartType | null = null
let dragStartX: number | null = null
let dragOverlay: HTMLElement | null = null

const chartData = computed(() => tempStore.chartDatasets)

const DISPLAY_FORMATS: Record<ChartScale, Record<string, string>> = {
  '30min': {minute: 'HH:mm'},
  '1hour': {minute: 'HH:mm'},
  '1day': {hour: 'dd/MM HH:mm'},
}

async function setScale(scale: ChartScale) {
  tempStore.setScale(scale)
  await tempStore.loadChartData()
  await tempStore.loadOutdoorChartData()
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

  chartInstance = new Chart(chartCanvas.value, {
    type: 'line',
    data: {datasets: chartData.value},
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: {mode: 'nearest', intersect: false, axis: 'x'},
      scales: {
        x: {
          type: 'time',
          min: tempStore.dateBegin ? tempStore.dateBegin * 1000 : undefined,
          max: tempStore.dateEnd ? tempStore.dateEnd * 1000 : undefined,
          title: {display: true, text: t('temperature.chart.xAxis'), color: GRID_LINE_COLOR},
          time: {
            displayFormats: DISPLAY_FORMATS[tempStore.selectedScale],
          },
          ticks: {color: GRID_LINE_COLOR},
          grid: {display: false},
        },
        y: {
          type: 'linear',
          display: true,
          position: 'left',
          title: {display: true, text: t('temperature.chart.yAxis'), color: GRID_LINE_COLOR},
          min: Math.min(...allPoints.map((p) => p.y)) - CHART_PADDING,
          max: Math.max(...allPoints.map((p) => p.y)) + CHART_PADDING,
          ticks: {color: GRID_LINE_COLOR},
          grid: {color: 'rgba(0,0,0,0.05)'},
        },
      },
      plugins: {
        legend: {display: false},
        tooltip: {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          position: 'verticalCursor' as any,
          usePointStyle: true,
          padding: TOOLTIP_PADDING,
          bodySpacing: TOOLTIP_BODY_SPACING,
          bodyFont: {family: 'monospace'},
          boxWidth: TOOLTIP_BOX_SIZE,
          boxHeight: TOOLTIP_BOX_SIZE,
          boxPadding: TOOLTIP_BOX_PADDING,
          titleMarginBottom: TOOLTIP_TITLE_MARGIN_BOTTOM,
          callbacks: {
            title: (items: { label: string; parsed: { x: number | null } }[]) => {
              const ts = items[0]?.parsed.x
              if (ts == null) return ''
              return new Date(ts).toLocaleString()
            },
            label: (tooltipItem: { dataset: { label?: string }; parsed: { y: number | null } }) => {
              const name = (tooltipItem.dataset.label ?? '').padEnd(22)
              const value = tooltipItem.parsed.y?.toFixed(1) ?? '--'
              return `${name} ${value}°C`
            },
          },
        },
      },
    },
  })

  chartCanvas.value.removeEventListener('mousedown', onCanvasMouseDown)
  chartCanvas.value.addEventListener('mousedown', onCanvasMouseDown)
  chartCanvas.value.removeEventListener('touchstart', onCanvasTouchStart)
  chartCanvas.value.addEventListener('touchstart', onCanvasTouchStart)
}

function ensureDragOverlay() {
  if (!dragOverlay && chartCanvas.value) {
    dragOverlay = document.createElement('div')
    Object.assign(dragOverlay.style, {
      position: 'absolute',
      top: '0',
      height: '100%',
      background: 'rgba(224, 82, 151, 0.15)',
      border: '1px solid rgba(224, 82, 151, 0.6)',
      pointerEvents: 'none',
      display: 'none',
      zIndex: '10',
    })
    chartCanvas.value.parentElement?.appendChild(dragOverlay)
  }
  return dragOverlay
}

function clampClientX(clientX: number): number | null {
  const area = chartInstance?.chartArea
  if (!area || !chartCanvas.value) return null
  const rect = chartCanvas.value.getBoundingClientRect()
  return Math.max(area.left, Math.min(clientX - rect.left, area.right))
}

function setOverlay(x: number) {
  const overlay = ensureDragOverlay()
  if (!overlay || dragStartX === null) return
  overlay.style.display = 'block'
  overlay.style.left = `${Math.min(dragStartX, x)}px`
  overlay.style.width = `${Math.abs(x - dragStartX)}px`
}

function finalizeDrag(endX: number) {
  const overlay = ensureDragOverlay()
  if (overlay) overlay.style.display = 'none'
  if (dragStartX === null || !chartInstance) return
  if (Math.abs(endX - dragStartX) < DRAG_THRESHOLD) { dragStartX = null; return }

  const xScale = chartInstance.scales.x
  const minTime = xScale.getValueForPixel(Math.min(dragStartX, endX)) as number
  const maxTime = xScale.getValueForPixel(Math.max(dragStartX, endX)) as number
  dragStartX = null
  tempStore.zoomToDateRange(minTime, maxTime)
}

function onCanvasMouseDown(e: MouseEvent) {
  const x = clampClientX(e.clientX)
  if (x === null) return
  dragStartX = x
  setOverlay(x)
  document.addEventListener('mousemove', onDocMouseMove)
  document.addEventListener('mouseup', onDocMouseUp)
}

function onDocMouseMove(e: MouseEvent) {
  if (dragStartX === null) return
  const x = clampClientX(e.clientX)
  if (x !== null) setOverlay(x)
}

function onDocMouseUp(e: MouseEvent) {
  document.removeEventListener('mousemove', onDocMouseMove)
  document.removeEventListener('mouseup', onDocMouseUp)
  const endX = clampClientX(e.clientX)
  if (endX !== null) finalizeDrag(endX)
}

function onCanvasTouchStart(e: TouchEvent) {
  const x = clampClientX(e.touches[0].clientX)
  if (x === null) return
  e.preventDefault()
  dragStartX = x
  setOverlay(x)
  document.addEventListener('touchmove', onDocTouchMove, {passive: false})
  document.addEventListener('touchend', onDocTouchEnd)
}

function onDocTouchMove(e: TouchEvent) {
  if (dragStartX === null) return
  e.preventDefault()
  const x = clampClientX(e.touches[0].clientX)
  if (x !== null) setOverlay(x)
}

function onDocTouchEnd(e: TouchEvent) {
  document.removeEventListener('touchmove', onDocTouchMove)
  document.removeEventListener('touchend', onDocTouchEnd)
  const endX = clampClientX(e.changedTouches[0].clientX)
  if (endX !== null) finalizeDrag(endX)
}

watch(() => tempStore.selectedRoomIds, async () => {
  await tempStore.loadChartData()
  await tempStore.loadOutdoorChartData()
}, {deep: true})

watch(() => locale.value, () => {
  const outdoorLabel = t('temperature.chart.outdoorLabel')
  tempStore.chartDatasets = tempStore.chartDatasets.map((d) => {
    if (d.borderColor === TOOLTIP_CURSOR_COLOR) {
      return {...d, label: outdoorLabel}
    }
    return d
  })
})

watch(() => homeStore.homeStatus, () => {
  tempStore.reset()
})

watch(chartData, () => {
  nextTick(() => {
    renderChart()
  })
})

onMounted(() => {
  tempStore.loadOutdoorChartData()
  renderChart()
})

onUnmounted(() => {
  document.removeEventListener('mousemove', onDocMouseMove)
  document.removeEventListener('mouseup', onDocMouseUp)
  document.removeEventListener('touchmove', onDocTouchMove)
  document.removeEventListener('touchend', onDocTouchEnd)
  if (chartCanvas.value) {
    chartCanvas.value.removeEventListener('mousedown', onCanvasMouseDown)
    chartCanvas.value.removeEventListener('touchstart', onCanvasTouchStart)
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
        class="opacity-60 text-base"
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
            <div class="room-header">
              <h4 class="card-title">
                {{ room.name || t('temperature.fallbackRoom', {id: room.id}) }}
              </h4>
              <input
                type="checkbox"
                class="room-checkbox"
                :checked="tempStore.selectedRoomIds.includes(room.id)"
                @click.stop
                @change="tempStore.toggleRoomSelection(room.id)"
              >
            </div>

            <div class="flex items-center gap-3 mb-3">
              <!-- Bouton Flèche Bas (Moins) -->
              <button
                class="btn-temp-minus"
                @click.stop="tempStore.changeRoomTemperature(room.id, -0.5)"
              >
                <IconArrowDown />
              </button>

              <div class="text-2xl font-mono text-[#e05297]">
                {{ getRoomStatus(room.id)?.therm_measured_temperature ?? '--' }}°C
              </div>

              <button
                class="btn-temp-plus"
                @click.stop="tempStore.changeRoomTemperature(room.id, 0.5)"
              >
                <IconArrowUp />
              </button>
            </div>

            <div class="text-sm opacity-60 space-y-1">
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
              <div class="text-sm font-bold opacity-80 mb-2">
                {{ t('temperature.valves') }}
              </div>
              <div
                v-for="valve in tempStore.getValveModulesForRoom(room.id)"
                :key="valve.id"
                class="text-sm opacity-70 mb-1"
              >
                <div>{{ valve.name || `VALVE ${valve.id}` }}</div>
                <div>{{ t('temperature.battery') }} {{ formatBattery(valve.batteryLevel, valve.batteryState) }}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div
        class="mt-6"
      >
        <div class="flex items-center justify-between mb-4">
          <div class="flex flex-wrap items-center gap-2">
            <button
              v-if="tempStore.dateBegin != null"
              class="btn btn-xs btn-ghost"
              @click="resetZoom"
            >
              {{ t('temperature.chart.resetZoom') }}
            </button>
            <div class="join">
              <button
                v-for="scale in tempStore.availableScales"
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
.room-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.room-checkbox {
  width: 22px;
  height: 22px;
  accent-color: #e05297;
  cursor: pointer;
  flex-shrink: 0;
}

.btn-temp-minus {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 22px;
  font-weight: 700;
  background: linear-gradient(135deg, rgba(244, 132, 95, 0.12), rgba(244, 132, 95, 0.04));
  border: 1px solid rgba(244, 132, 95, 0.25);
  color: #f4845f;
  transition: transform 0.2s;
  cursor: pointer;
}

.btn-temp-minus:hover {
  transform: scale(1.1);
}

.btn-temp-minus:active {
  transform: scale(0.9);
}

.btn-temp-plus {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 22px;
  font-weight: 700;
  background: linear-gradient(135deg, rgba(110, 220, 159, 0.12), rgba(110, 220, 159, 0.04));
  border: 1px solid rgba(110, 220, 159, 0.25);
  color: #6edc9f;
  transition: transform 0.2s;
  cursor: pointer;
}

.btn-temp-plus:hover {
  transform: scale(1.1);
}

.btn-temp-plus:active {
  transform: scale(0.9);
}

</style>
