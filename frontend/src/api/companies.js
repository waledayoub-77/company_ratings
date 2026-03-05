import { request, authRequest } from './client'

// ─── Public ──────────────────────────────────────────────────────────────────

/**
 * GET /companies
 * @param {Object} params — search, industry, location, minRating, sort, page, limit
 */
export async function getCompanies(params = {}) {
  const qs = new URLSearchParams(
    Object.entries(params).filter(([, v]) => v !== '' && v != null)
  ).toString()
  return request(`/companies${qs ? `?${qs}` : ''}`)
}

/**
 * GET /companies/:id
 */
export async function getCompanyById(id) {
  return request(`/companies/${id}`)
}

/**
 * GET /companies/:companyId/reviews
 * @param {Object} params — sort, page, limit
 */
export async function getCompanyReviews(companyId, params = {}) {
  const qs = new URLSearchParams(
    Object.entries(params).filter(([, v]) => v !== '' && v != null)
  ).toString()
  const url = `/companies/${companyId}/reviews${qs ? `?${qs}` : ''}`
  // Send auth token when available so backend can set is_own on each review
  const token = localStorage.getItem('rh_access')
  return token ? authRequest(url) : request(url)
}

/**
 * GET /companies/:id/analytics
 */
export async function getCompanyAnalytics(id) {
  return request(`/companies/${id}/analytics`)
}

/**
 * GET /companies/:id/stats
 */
export async function getCompanyStats(id) {
  return request(`/companies/${id}/stats`)
}

// ─── Protected ───────────────────────────────────────────────────────────────

/**
 * POST /companies
 * @param {Object} data — name, industry, location, description, website
 */
export async function createCompany(data) {
  return authRequest('/companies', {
    method: 'POST',
    body:   JSON.stringify(data),
  })
}

/**
 * PATCH /companies/:id
 * @param {Object} data — partial company fields
 */
export async function updateCompany(id, data) {
  return authRequest(`/companies/${id}`, {
    method: 'PATCH',
    body:   JSON.stringify(data),
  })
}

/**
 * DELETE /companies/:id
 */
export async function deleteCompany(id) {
  return authRequest(`/companies/${id}`, { method: 'DELETE' })
}

/**
 * GET /companies/:id/employees
 * List approved employees at a company (for feedback coworker picker)
 */
export async function getCompanyEmployees(id) {
  return authRequest(`/companies/${id}/employees`)
}
