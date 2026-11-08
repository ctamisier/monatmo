import {
  Chart,
  Filler,
  LinearScale,
  LineController,
  LineElement,
  PointElement,
  TimeScale,
  Tooltip,
} from 'chart.js'
import type { Chart as ChartInstance, ChartType, TooltipPositionerFunction } from 'chart.js'
import 'chartjs-adapter-date-fns'
import {
  CHART_PADDING,
  CROSSHAIR_COLOR,
  GRID_LINE_COLOR,
  TOOLTIP_BODY_SPACING,
  TOOLTIP_BOX_PADDING,
  TOOLTIP_BOX_SIZE,
  TOOLTIP_OFFSET_Y,
  TOOLTIP_PADDING,
  TOOLTIP_TITLE_MARGIN_BOTTOM,
} from '../constants/chart'
import type { TemperatureDataset, TemperaturePoint } from '../types/temperature'

declare module 'chart.js' {
  interface TooltipPositionerMap {
    verticalCursor: TooltipPositionerFunction<ChartType>
  }
}

Chart.register(Tooltip, LineController, LineElement, PointElement, LinearScale, TimeScale, Filler)

Tooltip.positioners.verticalCursor = (_items, eventPosition) => ({
  x: eventPosition.x ?? 0,
  y: (eventPosition.y ?? 0) - TOOLTIP_OFFSET_Y,
})

Chart.register({
  id: 'verticalLine',
  afterDraw(chart) {
    const activeElement = chart.tooltip?.getActiveElements()[0]
    if (!activeElement) return

    const { ctx } = chart
    const x = activeElement.element.x
    const { top, bottom } = chart.scales.y

    ctx.save()
    ctx.beginPath()
    ctx.moveTo(x, top)
    ctx.lineTo(x, bottom)
    ctx.lineWidth = 1
    ctx.strokeStyle = CROSSHAIR_COLOR
    ctx.stroke()
    ctx.restore()
  },
})

export type TemperatureChartParams = {
  datasets: TemperatureDataset[]
  dateBegin?: number
  dateEnd?: number
  displayFormat: Record<string, string>
  xAxisLabel: string
  yAxisLabel: string
  locale: string
}

function getValueBounds(points: readonly TemperaturePoint[]): { min: number; max: number } {
  let min = Number.POSITIVE_INFINITY
  let max = Number.NEGATIVE_INFINITY

  for (const point of points) {
    if (point.y < min) min = point.y
    if (point.y > max) max = point.y
  }

  return { min, max }
}

// Vue partielle utilisée pour mettre à jour les options d'un graphe existant :
// Chart.js type `min`/`max` comme requis alors qu'ils acceptent `undefined`.
type MutableScaleOptions = {
  min?: number
  max?: number
  title?: { text?: string }
  time?: { displayFormats?: Record<string, string> }
}

function applyScaleOptions(
  chart: ChartInstance<'line', TemperaturePoint[]>,
  params: TemperatureChartParams,
): void {
  const bounds = getValueBounds(params.datasets.flatMap((dataset) => dataset.data))

  const xScale = chart.options.scales?.x as unknown as MutableScaleOptions | undefined
  if (xScale) {
    xScale.min = params.dateBegin != null ? params.dateBegin * 1000 : undefined
    xScale.max = params.dateEnd != null ? params.dateEnd * 1000 : undefined
    if (xScale.time) xScale.time.displayFormats = params.displayFormat
    if (xScale.title) xScale.title.text = params.xAxisLabel
  }

  const yScale = chart.options.scales?.y as unknown as MutableScaleOptions | undefined
  if (yScale) {
    yScale.min = bounds.min - CHART_PADDING
    yScale.max = bounds.max + CHART_PADDING
    if (yScale.title) yScale.title.text = params.yAxisLabel
  }
}

/**
 * Met à jour le graphe existant sans le détruire : évite de faire
 * réapparaître le canvas (et son animation) à chaque chargement de données.
 */
export function updateTemperatureChart(
  chart: ChartInstance<'line', TemperaturePoint[]>,
  params: TemperatureChartParams,
): void {
  chart.data.datasets = params.datasets
  applyScaleOptions(chart, params)
  chart.update()
}

export function createTemperatureChart(
  canvas: HTMLCanvasElement,
  params: TemperatureChartParams,
): ChartInstance<'line', TemperaturePoint[]> {
  const points = params.datasets.flatMap((dataset) => dataset.data)
  const bounds = getValueBounds(points)

  return new Chart<'line', TemperaturePoint[]>(canvas, {
    type: 'line',
    data: { datasets: params.datasets },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: 'nearest', intersect: false, axis: 'x' },
      scales: {
        x: {
          type: 'time',
          min: params.dateBegin != null ? params.dateBegin * 1000 : undefined,
          max: params.dateEnd != null ? params.dateEnd * 1000 : undefined,
          title: { display: true, text: params.xAxisLabel, color: GRID_LINE_COLOR },
          time: { displayFormats: params.displayFormat },
          ticks: { color: GRID_LINE_COLOR },
          grid: { display: false },
        },
        y: {
          type: 'linear',
          display: true,
          position: 'left',
          title: { display: true, text: params.yAxisLabel, color: GRID_LINE_COLOR },
          min: bounds.min - CHART_PADDING,
          max: bounds.max + CHART_PADDING,
          ticks: { color: GRID_LINE_COLOR },
          grid: { color: 'rgba(0,0,0,0.05)' },
        },
      },
      plugins: {
        legend: { display: false },
        tooltip: {
          position: 'verticalCursor',
          usePointStyle: true,
          padding: TOOLTIP_PADDING,
          bodySpacing: TOOLTIP_BODY_SPACING,
          bodyFont: { family: 'monospace' },
          boxWidth: TOOLTIP_BOX_SIZE,
          boxHeight: TOOLTIP_BOX_SIZE,
          boxPadding: TOOLTIP_BOX_PADDING,
          titleMarginBottom: TOOLTIP_TITLE_MARGIN_BOTTOM,
          callbacks: {
            title: (items) => {
              const timestamp = items[0]?.parsed.x
              if (timestamp == null) return ''
              return new Date(timestamp).toLocaleString(params.locale)
            },
            label: (item) => {
              const name = (item.dataset.label ?? '').padEnd(22)
              const value = item.parsed.y?.toFixed(1) ?? '--'
              return `${name} ${value}°C`
            },
          },
        },
      },
    },
  })
}
