import { request, authRequest } from './client'

// ─── Public (no auth required) ───────────────────────────────────────────────

/** POST /auth/register */
export async function apiRegister({ email, password, role, fullName, companyName }) {
  return request('/auth/register', {
    method: 'POST',
    body:   JSON.stringify({ email, password, role, fullName, companyName }),
  })
  // returns { data: { id, email, role, emailVerified }, message }
}

/** POST /auth/login */
export async function apiLogin({ email, password }) {
  return request('/auth/login', {
    method: 'POST',
    body:   JSON.stringify({ email, password }),
  })
  // returns { user, accessToken, refreshToken }
}

/** POST /auth/refresh-token */
export async function apiRefreshToken(refreshToken) {
  return request('/auth/refresh-token', {
    method: 'POST',
    body:   JSON.stringify({ refreshToken }),
  })
}

/** GET /auth/verify-email/:token */
export async function apiVerifyEmail(token) {
  return request(`/auth/verify-email/${token}`)
}

/** POST /auth/forgot-password */
export async function apiForgotPassword(email) {
  return request('/auth/forgot-password', {
    method: 'POST',
    body:   JSON.stringify({ email }),
  })
}

/** POST /auth/reset-password/:token */
export async function apiResetPassword(token, password) {
  return request(`/auth/reset-password/${token}`, {
    method: 'POST',
    body:   JSON.stringify({ password }),
  })
}

// ─── Protected (auth required) ───────────────────────────────────────────────

/** POST /auth/logout */
export async function apiLogout() {
  return authRequest('/auth/logout', { method: 'POST' })
}

/** GET /auth/me — rehydrate user from token */
export async function apiGetMe() {
  return authRequest('/auth/me')
}
