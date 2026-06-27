import type { PublicDataStation } from '../types/netatmo'
import { EARTH_RADIUS_KM } from '../constants/chart'

function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLon = ((lon2 - lon1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2)
  return EARTH_RADIUS_KM * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

function formatStationName(station: PublicDataStation, dist: number): string {
  const city = station.place.city || station.place.country || ''
  const street = station.place.street ? `, ${station.place.street}` : ''
  return `${city}${street} (${dist.toFixed(1)} km)`
}

function extractTempData(station: PublicDataStation): { temp: number; humidity: number } | null {
  for (const [, measure] of Object.entries(station.measures)) {
    const types = Array.isArray(measure.type) ? measure.type : []
    if (types.includes('temperature') && measure.res) {
      const values = measure.res as Record<string, number[]>
      const keys = Object.keys(values)
      if (keys.length > 0) {
        const latestKey = keys[keys.length - 1]
        const vals = values[latestKey]
        if (Array.isArray(vals) && vals.length > 0) {
          return {
            temp: vals[0],
            humidity: (types.includes('humidity') && vals.length > 1) ? vals[1] : 0,
          }
        }
      }
    }
  }
  return null
}

export function findClosestStation(
  stations: PublicDataStation[],
  userLat: number,
  userLon: number,
): { temp: number; humidity: number; name: string } | null {
  let closest: { temp: number; humidity: number; name: string; dist: number } | null = null

  for (const station of stations) {
    const stationLat = station.place.location[1]
    const stationLon = station.place.location[0]
    const dist = haversineDistance(userLat, userLon, stationLat, stationLon)

    const tempData = extractTempData(station)
    if (tempData && (!closest || dist < closest.dist)) {
      closest = { ...tempData, name: formatStationName(station, dist), dist }
    }
  }

  return closest
}
