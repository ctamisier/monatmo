import type { AuthConfig, TokenData } from '../types/auth'
import { i18n } from '../i18n'

const STORAGE = {
  CLIENT_ID: 'netatmo_client_id',
  CLIENT_SECRET: 'netatmo_client_secret',
  REDIRECT_URI: 'netatmo_redirect_uri',
  SCOPE: 'netatmo_scope',
  CODE_VERIFIER: 'netatmo_code_verifier',
  STATE: 'netatmo_state',
  TOKEN: 'netatmo_token',
} as const

const AUTH_API = {
  AUTH: 'https://api.netatmo.com/oauth2/authorize',
  TOKEN: 'https://api.netatmo.com/oauth2/token',
} as const

export const DEFAULT_SCOPE = 'read_thermostat write_thermostat read_magellan write_magellan'

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
  return Math.random().toString(36).substring(2, 15) +
    Math.random().toString(36).substring(2, 15)
}

export function loadConfig(): AuthConfig {
  return {
    clientId: localStorage.getItem(STORAGE.CLIENT_ID) || '',
    clientSecret: localStorage.getItem(STORAGE.CLIENT_SECRET) || '',
    redirectUri: localStorage.getItem(STORAGE.REDIRECT_URI) || 'https://ctamisier.github.io/monatmo/',
    scope: localStorage.getItem(STORAGE.SCOPE) || DEFAULT_SCOPE,
  }
}

export function saveConfig(config: AuthConfig): void {
  localStorage.setItem(STORAGE.CLIENT_ID, config.clientId)
  localStorage.setItem(STORAGE.CLIENT_SECRET, config.clientSecret)
  localStorage.setItem(STORAGE.REDIRECT_URI, config.redirectUri)
  localStorage.setItem(STORAGE.SCOPE, config.scope)
}

export function clearLocalStorage(): void {
  localStorage.removeItem(STORAGE.CLIENT_ID)
  localStorage.removeItem(STORAGE.CLIENT_SECRET)
  localStorage.removeItem(STORAGE.REDIRECT_URI)
  localStorage.removeItem(STORAGE.SCOPE)
  localStorage.removeItem(STORAGE.TOKEN)
  sessionStorage.removeItem(STORAGE.CODE_VERIFIER)
  sessionStorage.removeItem(STORAGE.STATE)
}

export async function startAuth(config: AuthConfig): Promise<void> {
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
  const config = loadConfig()
  const codeVerifier = sessionStorage.getItem(STORAGE.CODE_VERIFIER)
  if (!codeVerifier) {
    throw new Error(i18n.global.t('errors.codeVerifierNotFound'))
  }
  sessionStorage.removeItem(STORAGE.CODE_VERIFIER)

  const params = new URLSearchParams({
    grant_type: 'authorization_code',
    client_id: config.clientId,
    client_secret: config.clientSecret,
    code,
    redirect_uri: config.redirectUri,
    code_verifier: codeVerifier,
  })

  const response = await fetch(AUTH_API.TOKEN, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params.toString(),
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(i18n.global.t('errors.errorStatus', { status: response.status, error: error.error || i18n.global.t('netatmo.unknownError') }))
  }

  return response.json()
}

export function saveToken(tokenData: TokenData): void {
  const tokenWithTimestamp = { ...tokenData, timestamp: Date.now() }
  localStorage.setItem(STORAGE.TOKEN, JSON.stringify(tokenWithTimestamp))
}

export function getValidToken(): TokenData | null {
  const tokenStr = localStorage.getItem(STORAGE.TOKEN)
  if (!tokenStr) return null

  const token: TokenData = JSON.parse(tokenStr)
  if (!token.access_token) return null

  if (token.expires_in) {
    const expiresAt = token.timestamp + (token.expires_in * 1000)
    if (Date.now() > expiresAt) return null
  }

  return token
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
  const config = loadConfig()
  const tokenStr = localStorage.getItem(STORAGE.TOKEN)
  if (!tokenStr) return null

  const token: TokenData = JSON.parse(tokenStr)
  if (!token.refresh_token) return null

  const params = new URLSearchParams({
    grant_type: 'refresh_token',
    refresh_token: token.refresh_token,
    client_id: config.clientId,
    client_secret: config.clientSecret,
  })

  const response = await fetch(AUTH_API.TOKEN, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params.toString(),
  })

  if (!response.ok) return null

  const data = await response.json()
  const newToken: TokenData = {
    ...data,
    refresh_token: data.refresh_token || token.refresh_token,
    timestamp: Date.now(),
  }
  saveToken(newToken)
  return newToken
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
