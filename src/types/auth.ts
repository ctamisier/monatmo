export type AuthConfig = {
  clientId: string
  clientSecret: string
  redirectUri: string
  scope: string
}

export type TokenData = {
  access_token: string
  refresh_token: string
  expires_in: number
  scope: string
  timestamp: number
}
