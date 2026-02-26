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
 */
export async function endEmployment(id) {
  return authRequest(`/employments/${id}/end`, { method: 'PATCH' })
}
