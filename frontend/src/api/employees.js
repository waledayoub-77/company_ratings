import { authRequest, request } from './client'

/**
 * GET /employees/:id
 * Public — returns limited data for non-owners, full data for owner/admin
 */
export async function getEmployeeProfile(id) {
  // Uses optionalAuth on backend — send token if we have one
  const token = localStorage.getItem('rh_access')
  if (token) return authRequest(`/employees/${id}`)
  return request(`/employees/${id}`)
}

/**
 * PATCH /employees/:id
 * @param {Object} data — fullName, title, bio, location, phone
 */
export async function updateEmployeeProfile(id, data) {
  return authRequest(`/employees/${id}`, {
    method: 'PATCH',
    body:   JSON.stringify(data),
  })
}
