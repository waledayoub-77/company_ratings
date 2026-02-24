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
