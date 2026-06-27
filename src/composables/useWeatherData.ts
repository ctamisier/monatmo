import { ref } from 'vue'
import { i18n } from '../i18n'
import { fetchPublicData } from '../services/netatmo.service'
import { findClosestStation } from '../utils/weather'
import { GEOLOCATION_TIMEOUT, GEOLOCATION_MAX_AGE } from '../constants/chart'

const { t } = i18n.global

export function useWeatherData() {
  const temperature = ref<number | null>(null)
  const humidity = ref<number | null>(null)
  const stationName = ref('')
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function fetchFromCoords(lat: number, lon: number) {
    loading.value = true
    error.value = null

    try {
      const response = await fetchPublicData(lat, lon)

      if (!response.body || response.body.length === 0) {
        error.value = t('weather.noData')
        return
      }

      const closest = findClosestStation(response.body, lat, lon)

      if (closest) {
        temperature.value = closest.temp
        humidity.value = closest.humidity
        stationName.value = closest.name
      } else {
        error.value = t('weather.noData')
      }
    } catch {
      error.value = t('weather.noData')
    } finally {
      loading.value = false
    }
  }

  async function fetchWeather() {
    loading.value = true
    error.value = null

    try {
      const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: GEOLOCATION_TIMEOUT,
          maximumAge: GEOLOCATION_MAX_AGE,
        })
      })

      await fetchFromCoords(pos.coords.latitude, pos.coords.longitude)
    } catch (e: unknown) {
      if (e instanceof GeolocationPositionError) {
        error.value = t('weather.gpsError')
      } else {
        error.value = e instanceof Error ? e.message : t('errors.loadingData')
      }
    } finally {
      loading.value = false
    }
  }

  return {
    temperature,
    humidity,
    stationName,
    loading,
    error,
    fetchWeather,
    fetchFromCoords,
  }
}
