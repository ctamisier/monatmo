const NETATMO_TOKEN_URL = 'https://api.netatmo.com/oauth2/token'

type Env = {
  NETATMO_CLIENT_ID: string
  NETATMO_CLIENT_SECRET: string
  NETATMO_SCOPE: string
  NETATMO_REDIRECT_URI: string
  ASSETS: { fetch: typeof fetch }
}

type TokenRequest = {
  code?: string
  code_verifier?: string
  refresh_token?: string
}

function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

function handleConfig(env: Env): Response {
  return jsonResponse({
    clientId: env.NETATMO_CLIENT_ID,
    redirectUri: env.NETATMO_REDIRECT_URI,
    scope: env.NETATMO_SCOPE,
  })
}

async function exchangeWithNetatmo(params: URLSearchParams): Promise<Response> {
  const response = await fetch(NETATMO_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params.toString(),
  })

  const data = await response.json().catch(() => ({}))
  return jsonResponse(data, response.status)
}

async function handleTokenExchange(request: Request, env: Env): Promise<Response> {
  const body = (await request.json()) as TokenRequest

  if (!body.code || !body.code_verifier) {
    return jsonResponse({ error: 'missing_required_fields' }, 400)
  }

  return exchangeWithNetatmo(new URLSearchParams({
    grant_type: 'authorization_code',
    client_id: env.NETATMO_CLIENT_ID,
    client_secret: env.NETATMO_CLIENT_SECRET,
    code: body.code,
    redirect_uri: env.NETATMO_REDIRECT_URI,
    code_verifier: body.code_verifier,
  }))
}

async function handleTokenRefresh(request: Request, env: Env): Promise<Response> {
  const body = (await request.json()) as TokenRequest

  if (!body.refresh_token) {
    return jsonResponse({ error: 'missing_refresh_token' }, 400)
  }

  return exchangeWithNetatmo(new URLSearchParams({
    grant_type: 'refresh_token',
    refresh_token: body.refresh_token,
    client_id: env.NETATMO_CLIENT_ID,
    client_secret: env.NETATMO_CLIENT_SECRET,
  }))
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url)

    if (url.pathname === '/api/config' && request.method === 'GET') {
      return handleConfig(env)
    }

    if (url.pathname === '/api/token' && request.method === 'POST') {
      return handleTokenExchange(request, env)
    }

    if (url.pathname === '/api/token/refresh' && request.method === 'POST') {
      return handleTokenRefresh(request, env)
    }

    return env.ASSETS.fetch(request)
  },
} satisfies ExportedHandler<Env>
