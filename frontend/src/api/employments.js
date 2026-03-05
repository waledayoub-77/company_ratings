import { authRequest } from './client'

/**
 * POST /employments/request
 * @param {Object} data — companyId, position, startDate, endDate (optional)
 */
export async function requestEmployment(data) {
  return authRequest('/employments/request', {
    method: 'POST',
    body:   JSON.stringify(data),
  })
}

/**
 * GET /employments — current user's employment history
 */
export async function getMyEmployments() {
  return authRequest('/employments')
}

/**
 * GET /employments/all — all employments (pending + approved + rejected) for company admin
 */
export async function getAllEmploymentsForAdmin() {
  return authRequest('/employments/all')
}

/**
 * GET /employments/pending — pending requests for the company admin's company
 */
export async function getPendingEmployments() {
  return authRequest('/employments/pending')
}

/**
 * PATCH /employments/:id/approve
 */
export async function approveEmployment(id) {
  return authRequest(`/employments/${id}/approve`, { method: 'PATCH' })
}

/**
 * PATCH /employments/:id/reject
 * @param {Object} data — reason (optional)
 */
export async function rejectEmployment(id, data = {}) {
  return authRequest(`/employments/${id}/reject`, {
    method: 'PATCH',
    body:   JSON.stringify(data),
  })
}

/**
 * PATCH /employments/:id/end
 * @param {Object} data — endDate (optional, defaults to today on server)
 */
export async function endEmployment(id, data = {}) {
  return authRequest(`/employments/${id}/end`, {
    method: 'PATCH',
    body:   JSON.stringify(data),
  })
}

/**
 * DELETE /employments/:id/cancel — employee cancels their own pending request
 */
export async function cancelEmployment(id) {
  return authRequest(`/employments/${id}/cancel`, { method: 'DELETE' })
}

// ─── Feature 1: Admin invite ──────────────────────────────────────────────────

export async function inviteEmployee(data) {
  return authRequest('/employments/invite', {
    method: 'POST',
    body:   JSON.stringify(data),
  })
}

export async function acceptInvite(token) {
  return authRequest('/employments/accept-invite', {
    method: 'POST',
    body:   JSON.stringify({ token }),
  })
}

export async function getPendingInvites() {
  return authRequest('/employments/pending-invites')
}

export async function cancelInvite(id) {
  return authRequest(`/employments/${id}/cancel-invite`, { method: 'DELETE' })
}

// ─── Feature 2: Admin end employment ─────────────────────────────────────────

export async function endEmploymentByAdmin(id, data = {}) {
  return authRequest(`/employments/${id}/end-by-admin`, {
    method: 'PATCH',
    body:   JSON.stringify(data),
  })
}
