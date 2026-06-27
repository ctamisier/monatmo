import type { TokenData } from '../types/auth'
import { i18n } from '../i18n'

export type ServerConfig = {
  clientId: string
  redirectUri: string
  scope: string
}

const STORAGE = {
  CODE_VERIFIER: 'netatmo_code_verifier',
  STATE: 'netatmo_state',
  TOKEN: 'netatmo_token',
} as const

const AUTH_API = {
  AUTH: 'https://api.netatmo.com/oauth2/authorize',
} as const

function generateCodeVerifier(): string {
  const array = new Uint8Array(32)
  window.crypto.getRandomValues(array)
  return btoa(String.fromCharCode(...array))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

async function generateCodeChallenge(verifier: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(verifier)
  const hash = await crypto.subtle.digest('SHA-256', data)
  return btoa(String.fromCharCode(...new Uint8Array(hash)))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function generateState(): string {
  const array = new Uint8Array(16)
  window.crypto.getRandomValues(array)
  return btoa(String.fromCharCode(...array))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

export async function fetchConfig(): Promise<ServerConfig> {
  const response = await fetch('/api/config')
  if (!response.ok) {
    throw new Error(i18n.global.t('errors.loadingData'))
  }
  return response.json() as Promise<ServerConfig>
}

export async function startAuth(config: ServerConfig): Promise<void> {
  const codeVerifier = generateCodeVerifier()
  const codeChallenge = await generateCodeChallenge(codeVerifier)
  const state = generateState()

  sessionStorage.setItem(STORAGE.CODE_VERIFIER, codeVerifier)
  sessionStorage.setItem(STORAGE.STATE, state)

  const params = new URLSearchParams({
    client_id: config.clientId,
    redirect_uri: config.redirectUri,
    response_type: 'code',
    code_challenge: codeChallenge,
    code_challenge_method: 'S256',
    scope: config.scope,
    state,
  })

  window.location.href = `${AUTH_API.AUTH}?${params.toString()}`
}

async function exchangeCodeForToken(code: string): Promise<TokenData> {
  const codeVerifier = sessionStorage.getItem(STORAGE.CODE_VERIFIER)
  if (!codeVerifier) {
    throw new Error(i18n.global.t('errors.codeVerifierNotFound'))
  }
  sessionStorage.removeItem(STORAGE.CODE_VERIFIER)

  const response = await fetch('/api/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      code,
      code_verifier: codeVerifier,
    }),
  })

  if (!response.ok) {
    const error = (await response.json().catch(() => ({}))) as { error?: string }
    throw new Error(i18n.global.t('errors.errorStatus', { status: response.status, error: error.error || i18n.global.t('netatmo.unknownError') }))
  }

  return response.json() as Promise<TokenData>
}

export function saveToken(tokenData: TokenData): void {
  const tokenWithTimestamp = { ...tokenData, timestamp: Date.now() }
  localStorage.setItem(STORAGE.TOKEN, JSON.stringify(tokenWithTimestamp))
}

export function getValidToken(): TokenData | null {
  const tokenStr = localStorage.getItem(STORAGE.TOKEN)
  if (!tokenStr) return null

  try {
    const token: TokenData = JSON.parse(tokenStr)
    if (!token.access_token) return null

    if (token.expires_in) {
      const expiresAt = token.timestamp + (token.expires_in * 1000)
      if (Date.now() > expiresAt) return null
    }

    return token
  } catch (e: unknown) {
    console.error('Token validation error:', e)
    return null
  }
}

export function getCallbackCode(): string | null {
  const urlParams = new URLSearchParams(window.location.search)
  const code = urlParams.get('code')
  const error = urlParams.get('error')
  const errorDesc = urlParams.get('error_description')
  const state = urlParams.get('state')
  const storedState = sessionStorage.getItem(STORAGE.STATE)

  window.history.replaceState({}, document.title, window.location.pathname)

  if (error) {
    throw new Error(i18n.global.t('errors.oauthError', { error, description: errorDesc || i18n.global.t('errors.noDescription') }))
  }

  if (!code) return null

  if (state !== storedState) {
    throw new Error(i18n.global.t('errors.securityError'))
  }

  return code
}

export async function handleCallback(): Promise<TokenData | null> {
  const code = getCallbackCode()
  if (!code) return null

  const tokenData = await exchangeCodeForToken(code)
  saveToken(tokenData)
  return tokenData
}

export function removeToken(): void {
  localStorage.removeItem(STORAGE.TOKEN)
  sessionStorage.removeItem(STORAGE.CODE_VERIFIER)
  sessionStorage.removeItem(STORAGE.STATE)
}

async function refreshAccessToken(): Promise<TokenData | null> {
  const tokenStr = localStorage.getItem(STORAGE.TOKEN)
  if (!tokenStr) return null

  try {
    const token: TokenData = JSON.parse(tokenStr)
    if (!token.refresh_token) return null

    const response = await fetch('/api/token/refresh', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        refresh_token: token.refresh_token,
      }),
    })

    if (!response.ok) return null

    const data = (await response.json()) as TokenData & { refresh_token?: string }
    const newToken: TokenData = {
      ...data,
      refresh_token: data.refresh_token || token.refresh_token,
      timestamp: Date.now(),
    }
    saveToken(newToken)
    return newToken
  } catch (e: unknown) {
    console.error('Token refresh error:', e)
    return null
  }
}

let refreshPromise: Promise<TokenData | null> | null = null

export async function getRefreshedToken(): Promise<TokenData | null> {
  if (!refreshPromise) {
    refreshPromise = refreshAccessToken().finally(() => {
      refreshPromise = null
    })
  }
  return refreshPromise
}
