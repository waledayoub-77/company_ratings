const BASE = 'http://localhost:5000/api'

async function request(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  })
  const data = await res.json()
  if (!res.ok) {
    // Pull the most useful message out of the response
    const msg =
      data?.error?.message ||
      data?.message ||
      (Array.isArray(data?.error?.details) && data.error.details[0]?.msg) ||
      'Something went wrong'
    throw new Error(msg)
  }
  return data
}

export async function apiLogin({ email, password }) {
  return request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  })
  // returns { user, accessToken, refreshToken }
}

export async function apiRegister({ email, password, role, fullName, companyName }) {
  return request('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ email, password, role, fullName, companyName }),
  })
  // returns { data: { id, email, role, emailVerified }, message }
}
