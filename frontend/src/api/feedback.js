import { authRequest } from './client'

/**
 * POST /feedback
 * @param {Object} data — toEmployeeId, scores: { professionalism, communication, teamwork, reliability }, comment
 */
export async function submitFeedback(data) {
  return authRequest('/feedback', {
    method: 'POST',
    body:   JSON.stringify(data),
  })
}

/**
 * GET /feedback/received
 * @param {Object} params — employeeId (admin only, optional)
 */
export async function getFeedbackReceived(params = {}) {
  const qs = new URLSearchParams(
    Object.entries(params).filter(([, v]) => v !== '' && v != null)
  ).toString()
  return authRequest(`/feedback/received${qs ? `?${qs}` : ''}`)
}

/**
 * GET /feedback/given
 * @param {Object} params — employeeId (admin only, optional)
 */
export async function getFeedbackGiven(params = {}) {
  const qs = new URLSearchParams(
    Object.entries(params).filter(([, v]) => v !== '' && v != null)
  ).toString()
  return authRequest(`/feedback/given${qs ? `?${qs}` : ''}`)
}

/**
 * POST /feedback/:id/report — report a feedback entry to system admins
 * @param {string} id — feedback UUID
 * @param {Object} data — reason (string), description (string)
 */
export async function reportFeedback(id, data) {
  return authRequest(`/feedback/${id}/report`, {
    method: 'POST',
    body:   JSON.stringify(data),
  })
}

/**
 * GET /feedback/coworkers
 * Returns coworkers who share an approved current employment with the logged-in employee.
 * @param {Object} params — quarter (1-4, optional), year (optional)
 */
export async function getCoworkers(params = {}) {
  const qs = new URLSearchParams(
    Object.entries(params).filter(([, v]) => v !== '' && v != null)
  ).toString()
  return authRequest(`/feedback/coworkers${qs ? `?${qs}` : ''}`)
}
