const BASE = 'http://localhost:5000/api'

const ACCESS_KEY  = 'rh_access'
const REFRESH_KEY = 'rh_refresh'
const USER_KEY    = 'rh_user'

function getAccessToken() {
  return localStorage.getItem(ACCESS_KEY)
}

function getRefreshToken() {
  return localStorage.getItem(REFRESH_KEY)
}

function saveTokens(accessToken, refreshToken) {
  localStorage.setItem(ACCESS_KEY, accessToken)
  if (refreshToken) localStorage.setItem(REFRESH_KEY, refreshToken)
}

function clearAll() {
  localStorage.removeItem(ACCESS_KEY)
  localStorage.removeItem(REFRESH_KEY)
  localStorage.removeItem(USER_KEY)
}

async function tryRefresh() {
  const refreshToken = getRefreshToken()
  if (!refreshToken) throw new Error('No refresh token')

  const res = await fetch(`${BASE}/auth/refresh-token`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({ refreshToken }),
  })
  if (!res.ok) throw new Error('Refresh failed')

  const json = await res.json()
  const tokens = json.data ?? json
  saveTokens(tokens.accessToken, tokens.refreshToken)
  return tokens.accessToken
}

function extractError(data) {
  return (
    data?.error?.message ||
    data?.message ||
    (Array.isArray(data?.error?.details) && data.error.details[0]?.msg) ||
    'Something went wrong'
  )
}

// ─── Public request (no auth header) ─────────────────────────────────────────
export async function request(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  })
  const data = await res.json()
  if (!res.ok) throw new Error(extractError(data))
  return data
}

// ─── Authenticated request (injects Bearer token, auto-refreshes on 401) ─────
export async function authRequest(path, options = {}, _isRetry = false) {
  const token = getAccessToken()

  const res = await fetch(`${BASE}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
    ...options,
  })

  // Silent token refresh on first 401
  if (res.status === 401 && !_isRetry) {
    try {
      await tryRefresh()
      return authRequest(path, options, true)
    } catch {
      clearAll()
      window.location.href = '/login'
      throw new Error('Session expired. Please sign in again.')
    }
  }

  const data = await res.json()
  if (!res.ok) throw new Error(extractError(data))
  return data
}
