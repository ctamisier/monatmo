<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import type { Chart as ChartInstance } from 'chart.js'
import { useDragZoom } from '../../composables/useDragZoom'
import { OUTDOOR_DATASET_ID, TIME_DISPLAY_FORMATS } from '../../constants/chart'
import { createTemperatureChart } from '../../utils/temperatureChart'
import type { ChartScale, ChartScaleOption, TemperatureDataset, TemperaturePoint } from '../../types/temperature'
import IconRefresh from '../icons/IconRefresh.vue'

const props = defineProps<{
  datasets: TemperatureDataset[]
  dateBegin?: number
  dateEnd?: number
  selectedScale: ChartScale
  availableScales: readonly ChartScaleOption[]
  loading: boolean
}>()

const emit = defineEmits<{
  selectScale: [scale: ChartScale]
  reset: []
  zoom: [startMs: number, endMs: number]
}>()

const { t, locale } = useI18n()

const canvas = ref<HTMLCanvasElement | null>(null)
let chartInstance: ChartInstance<'line', TemperaturePoint[]> | null = null

const chartDatasets = computed(() => props.datasets.map((dataset) =>
  dataset.id === OUTDOOR_DATASET_ID
    ? { ...dataset, label: t('temperature.chart.outdoorLabel') }
    : dataset,
))

const chartAriaLabel = computed(() => `${t('temperature.title')} — ${t('temperature.chart.yAxis')}`)

function renderChart(): void {
  const canvasElement = canvas.value
  if (!canvasElement) return

  chartInstance?.destroy()
  chartInstance = null

  if (chartDatasets.value.length === 0) return

  chartInstance = createTemperatureChart(canvasElement, {
    datasets: chartDatasets.value,
    dateBegin: props.dateBegin,
    dateEnd: props.dateEnd,
    displayFormat: TIME_DISPLAY_FORMATS[props.selectedScale],
    xAxisLabel: t('temperature.chart.xAxis'),
    yAxisLabel: t('temperature.chart.yAxis'),
    locale: locale.value,
  })
}

useDragZoom(canvas, {
  getChartArea: () => chartInstance?.chartArea ?? null,
  toTimestamp: (pixelX) => chartInstance?.scales.x.getValueForPixel(pixelX) ?? null,
  onZoom: (startMs, endMs) => emit('zoom', startMs, endMs),
})

watch(
  [chartDatasets, () => props.dateBegin, () => props.dateEnd, () => props.selectedScale, locale],
  () => nextTick(renderChart),
)

onMounted(renderChart)

onBeforeUnmount(() => {
  chartInstance?.destroy()
  chartInstance = null
})
</script>

<template>
  <div>
    <div class="flex flex-wrap items-center justify-between gap-2 mb-4">
      <div
        class="join"
        role="group"
        :aria-label="t('temperature.title')"
      >
        <button
          v-for="scale in availableScales"
          :key="scale.value"
          type="button"
          class="join-item btn btn-sm"
          :class="selectedScale === scale.value ? 'btn-active btn-primary' : ''"
          :aria-pressed="selectedScale === scale.value"
          @click="emit('selectScale', scale.value)"
        >
          {{ t(scale.i18nKey) }}
        </button>
      </div>
      <button
        type="button"
        class="btn btn-sm btn-outline"
        :disabled="dateBegin == null || loading"
        @click="emit('reset')"
      >
        <IconRefresh
          class="size-4"
          aria-hidden="true"
        />
        {{ t('temperature.chart.resetZoom') }}
      </button>
    </div>

    <div class="relative h-80">
      <canvas
        ref="canvas"
        class="cursor-crosshair"
        role="img"
        :aria-label="chartAriaLabel"
      />
      <div
        v-if="loading"
        class="absolute inset-0 flex items-center justify-center bg-base-100/60 z-20"
      >
        <span class="loading loading-spinner loading-lg text-nebula-pink" />
      </div>
    </div>
  </div>
</template>
