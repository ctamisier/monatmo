export type ChartScale = '30min' | '1hour' | '1day'

export type TemperaturePoint = { x: number; y: number }

export type TemperatureDataset = {
  id: string
  label: string
  data: TemperaturePoint[]
  borderColor: string
  pointBackgroundColor: string
  borderDash?: number[]
}

export type ChartScaleOption = {
  value: ChartScale
  i18nKey: string
}

export type TemperatureValve = {
  id: string
  name?: string
  batteryLevel?: number
  batteryState?: string
}
