import { authRequest } from './client'

// ─── Reports ─────────────────────────────────────────────────────────────────

/**
 * POST /reports — any authenticated user can submit
 * @param {Object} data — reviewId, reason, description
 */
export async function submitReport(data) {
  return authRequest('/reports', {
    method: 'POST',
    body:   JSON.stringify(data),
  })
}

/**
 * GET /admin/reports
 * @param {Object} params — status, page, limit
 */
export async function getReports(params = {}) {
  const qs = new URLSearchParams(
    Object.entries(params).filter(([, v]) => v !== '' && v != null)
  ).toString()
  return authRequest(`/admin/reports${qs ? `?${qs}` : ''}`)
}

/**
 * GET /admin/reports/stats
 */
export async function getReportStats() {
  return authRequest('/admin/reports/stats')
}

/**
 * PATCH /admin/reports/:id/resolve
 * @param {Object} data — action: 'remove' | 'dismiss', adminNote (optional)
 */
export async function resolveReport(id, data) {
  return authRequest(`/admin/reports/${id}/resolve`, {
    method: 'PATCH',
    body:   JSON.stringify(data),
  })
}

// ─── Users ────────────────────────────────────────────────────────────────────

/**
 * GET /admin/users
 * @param {Object} params — search, role, status, page, limit
 */
export async function getAdminUsers(params = {}) {
  const qs = new URLSearchParams(
    Object.entries(params).filter(([, v]) => v !== '' && v != null)
  ).toString()
  return authRequest(`/admin/users${qs ? `?${qs}` : ''}`)
}

/**
 * PATCH /admin/users/:id/suspend
 * @param {Object} data — reason (optional)
 */
export async function suspendUser(id, data = {}) {
  return authRequest(`/admin/users/${id}/suspend`, {
    method: 'PATCH',
    body:   JSON.stringify(data),
  })
}

/**
 * PATCH /admin/users/:id/unsuspend
 */
export async function unsuspendUser(id) {
  return authRequest(`/admin/users/${id}/unsuspend`, { method: 'PATCH' })
}

/**
 * DELETE /admin/users/:id
 */
export async function deleteUser(id) {
  return authRequest(`/admin/users/${id}`, { method: 'DELETE' })
}

/**
 * PATCH /admin/users/bulk-suspend
 * @param {Object} data — userIds: string[]
 */
export async function bulkSuspendUsers(userIds) {
  return authRequest('/admin/users/bulk-suspend', {
    method: 'PATCH',
    body:   JSON.stringify({ userIds }),
  })
}

// ─── Companies ────────────────────────────────────────────────────────────────

/**
 * GET /admin/companies
 * @param {Object} params — verified, page, limit
 */
export async function getAdminCompanies(params = {}) {
  const qs = new URLSearchParams(
    Object.entries(params).filter(([, v]) => v !== '' && v != null)
  ).toString()
  return authRequest(`/admin/companies${qs ? `?${qs}` : ''}`)
}

/**
 * PATCH /admin/companies/:id/verify
 */
export async function verifyCompany(id) {
  return authRequest(`/admin/companies/${id}/verify`, { method: 'PATCH' })
}

// ─── Employment override ──────────────────────────────────────────────────────

/**
 * PATCH /admin/employments/:id/override
 * @param {Object} data — status: 'approved' | 'rejected'
 */
export async function overrideEmployment(id, data) {
  return authRequest(`/admin/employments/${id}/override`, {
    method: 'PATCH',
    body:   JSON.stringify(data),
  })
}

// ─── Analytics & Audit ───────────────────────────────────────────────────────

/**
 * GET /admin/analytics
 */
export async function getAdminAnalytics() {
  return authRequest('/admin/analytics')
}

/**
 * GET /admin/audit-logs
 * @param {Object} params — page, limit
 */
export async function getAuditLogs(params = {}) {
  const qs = new URLSearchParams(
    Object.entries(params).filter(([, v]) => v !== '' && v != null)
  ).toString()
  return authRequest(`/admin/audit-logs${qs ? `?${qs}` : ''}`)
}
