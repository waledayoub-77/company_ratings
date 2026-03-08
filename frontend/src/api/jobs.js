import { authRequest, request } from './client'

/** GET /jobs?companyId=X — list active job postings for a company */
export async function getJobPositions(companyId) {
  return request(`/jobs?companyId=${companyId}`)
}

/** GET /jobs/all?companyId=X — all job postings (admin) */
export async function getAllJobPositions(companyId) {
  const params = companyId ? `?companyId=${companyId}` : ''
  return authRequest(`/jobs/all${params}`)
}

/** GET /jobs/:id — single job posting */
export async function getJobPositionById(id) {
  return request(`/jobs/${id}`)
}

/** POST /jobs — create job posting (company admin) */
export async function createJobPosition(data) {
  return authRequest('/jobs', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

/** PATCH /jobs/:id/close — close posting */
export async function closeJobPosition(id) {
  return authRequest(`/jobs/${id}/close`, { method: 'PATCH' })
}

/** DELETE /jobs/:id — soft delete */
export async function deleteJobPosition(id) {
  return authRequest(`/jobs/${id}`, { method: 'DELETE' })
}

/** POST /jobs/:id/apply — apply to a job */
export async function applyToJob(positionId, data) {
  return authRequest(`/jobs/${positionId}/apply`, {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

/** GET /jobs/:id/applications — company admin: list applications */
export async function getApplications(positionId) {
  return authRequest(`/jobs/${positionId}/applications`)
}

/** PATCH /jobs/applications/:appId/status — company admin: update status */
export async function updateApplicationStatus(appId, data) {
  return authRequest(`/jobs/applications/${appId}/status`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  })
}

/** GET /jobs/my-applications — employee's own applications */
export async function getMyApplications() {
  return authRequest('/jobs/my-applications')
}
