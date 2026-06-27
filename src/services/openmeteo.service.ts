const BASE_URL = 'https://api.open-meteo.com'
const ARCHIVE_BASE_URL = 'https://archive-api.open-meteo.com'

const MAX_PAST_DAYS = 92
const MAX_FORECAST_DAYS = 16
const ARCHIVE_MAX_PAST_DAYS = 60

function clampDate(dateStr: string, minDate: Date, maxDate: Date): string {
  const d = new Date(dateStr)
  if (d < minDate) return minDate.toISOString().slice(0, 10)
  if (d > maxDate) return maxDate.toISOString().slice(0, 10)
  return dateStr
}

export type ForecastResponse = {
  latitude: number
  longitude: number
  timezone: string
  hourly: {
    time: number[]
    temperature_2m: (number | null)[]
  }
}

export async function fetchTemperatureForecast(
  lat: number,
  lon: number,
  startDate: string,
  endDate: string,
): Promise<ForecastResponse> {
  const now = new Date()
  const minDate = new Date(now)
  minDate.setDate(minDate.getDate() - MAX_PAST_DAYS)
  const maxDate = new Date(now)
  maxDate.setDate(maxDate.getDate() + MAX_FORECAST_DAYS)

  const clampedStart = clampDate(startDate, minDate, maxDate)
  const clampedEnd = clampDate(endDate, minDate, maxDate)

  const url = new URL(`${BASE_URL}/v1/forecast`)
  url.searchParams.set('latitude', String(lat))
  url.searchParams.set('longitude', String(lon))
  url.searchParams.set('start_date', clampedStart)
  url.searchParams.set('end_date', clampedEnd)
  url.searchParams.set('hourly', 'temperature_2m')
  url.searchParams.set('timezone', 'auto')
  url.searchParams.set('format', 'json')
  url.searchParams.set('timeformat', 'unixtime')

  const response = await fetch(url.toString())
  if (!response.ok) {
    throw new Error(`Open-Meteo error: ${response.status}`)
  }
  return response.json() as Promise<ForecastResponse>
}

export function isWithinForecastRange(startDate: string): boolean {
  const now = new Date()
  const limit = new Date(now)
  limit.setDate(limit.getDate() - ARCHIVE_MAX_PAST_DAYS)
  return new Date(startDate) >= limit
}

export async function fetchTemperatureArchive(
  lat: number,
  lon: number,
  startDate: string,
  endDate: string,
): Promise<ForecastResponse> {
  const url = new URL(`${ARCHIVE_BASE_URL}/v1/archive`)
  url.searchParams.set('latitude', String(lat))
  url.searchParams.set('longitude', String(lon))
  url.searchParams.set('start_date', startDate)
  url.searchParams.set('end_date', endDate)
  url.searchParams.set('hourly', 'temperature_2m')
  url.searchParams.set('timezone', 'auto')
  url.searchParams.set('format', 'json')
  url.searchParams.set('timeformat', 'unixtime')

  const response = await fetch(url.toString())
  if (!response.ok) {
    throw new Error(`Open-Meteo error: ${response.status}`)
  }
  return response.json() as Promise<ForecastResponse>
}

export function toDateString(ts: number): string {
  const d = new Date(ts)
  return d.toISOString().slice(0, 10)
}
