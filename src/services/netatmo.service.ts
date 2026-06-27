import type { HomesDataResponse, HomeStatusResponse, RoomMeasureResponse, SetStateResponse } from '../types/netatmo'
import { getValidToken, getRefreshedToken } from './auth.service'
import { i18n } from '../i18n'

const API_BASE = 'https://api.netatmo.com/api'

async function ensureToken(): Promise<string> {
  const token = getValidToken() ?? await getRefreshedToken()
  if (!token) {
    throw new Error(i18n.global.t('netatmo.loginRequired'))
  }
  return token.access_token
}

async function fetchWithRetry(url: string, init: RequestInit): Promise<Response> {
  const response = await fetch(url, init)
  if (response.status !== 401) return response

  const refreshed = await getRefreshedToken()
  if (!refreshed) return response

  return fetch(url, {
    ...init,
    headers: {
      ...init.headers as Record<string, string>,
      Authorization: `Bearer ${refreshed.access_token}`,
    },
  })
}

async function apiFetch<T>(endpoint: string, params?: Record<string, string>): Promise<T> {
  const accessToken = await ensureToken()

  const url = new URL(`${API_BASE}/${endpoint}`)
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.set(key, value)
    })
  }

  const response = await fetchWithRetry(url.toString(), {
    headers: { Authorization: `Bearer ${accessToken}` },
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(i18n.global.t('errors.errorStatus', { status: response.status, error: error.error?.message || i18n.global.t('netatmo.invalidToken') }))
  }

  return response.json()
}

async function apiPost<T>(endpoint: string, params: Record<string, string>): Promise<T> {
  const accessToken = await ensureToken()
  const body = new URLSearchParams(params)

  const response = await fetchWithRetry(`${API_BASE}/${endpoint}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: body.toString(),
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(i18n.global.t('errors.errorStatus', { status: response.status, error: error.error?.message || i18n.global.t('netatmo.unknownError') }))
  }

  return response.json()
}

export async function fetchHomesData(): Promise<HomesDataResponse> {
  return apiFetch<HomesDataResponse>('homesdata')
}

export async function fetchHomeStatus(homeId: string): Promise<HomeStatusResponse> {
  return apiFetch<HomeStatusResponse>('homestatus', { home_id: homeId })
}

export async function fetchRoomMeasure(
  homeId: string,
  roomId: string,
  scale: string,
  type: string,
  dateBegin?: number,
  dateEnd?: number,
): Promise<RoomMeasureResponse> {
  const params: Record<string, string> = {
    home_id: homeId,
    room_id: roomId,
    scale,
    type,
  }
  if (dateBegin !== undefined) params.date_begin = String(dateBegin)
  if (dateEnd !== undefined) params.date_end = String(dateEnd)
  return apiFetch<RoomMeasureResponse>('getroommeasure', params)
}

export async function setRoomThermpoint(
  homeId: string,
  roomId: string,
  mode: string,
  temp: number,
): Promise<void> {
  return apiPost<void>('setroomthermpoint', {
    home_id: homeId,
    room_id: roomId,
    mode,
    temp: String(temp),
  })
}

export type ModuleCommand = {
  id: string
  target_position?: number
  on?: boolean
  bridge?: string
}

export async function setModuleState(
  homeId: string,
  modules: ModuleCommand[],
): Promise<SetStateResponse> {
  const accessToken = await ensureToken()

  const response = await fetchWithRetry(`${API_BASE}/setstate`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      home: {
        id: homeId,
        modules,
      },
    }),
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(i18n.global.t('errors.errorStatus', { status: response.status, error: error.error?.message || i18n.global.t('netatmo.unknownError') }))
  }

  return response.json()
}
