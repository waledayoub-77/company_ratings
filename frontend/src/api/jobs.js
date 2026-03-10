import { authRequest, authRequestMultipart, authFetch, request } from './client'

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

/** POST /jobs/:id/apply — apply to a job (supports CV file upload) */
export async function applyToJob(positionId, { cvFile, coverLetter } = {}) {
  const formData = new FormData()
  if (cvFile) formData.append('cv', cvFile)
  if (coverLetter) formData.append('coverLetter', coverLetter)
  return authRequestMultipart(`/jobs/${positionId}/apply`, {
    method: 'POST',
    body: formData,
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

/** POST /jobs/applications/:appId/invite — admin sends interview invite email */
export async function sendInvite(appId) {
  return authRequest(`/jobs/applications/${appId}/invite`, { method: 'POST' })
}

/** POST /jobs/applications/:appId/accept-invite — employee accepts invitation */
export async function acceptInvite(appId) {
  return authRequest(`/jobs/applications/${appId}/accept-invite`, { method: 'POST' })
}

/** POST /jobs/applications/:appId/hire-invite — admin sends employment offer */
export async function sendHireInvite(appId) {
  return authRequest(`/jobs/applications/${appId}/hire-invite`, { method: 'POST' })
}

/** POST /jobs/applications/:appId/accept-hire — employee accepts employment offer */
export async function acceptHireInvite(appId) {
  return authRequest(`/jobs/applications/${appId}/accept-hire`, { method: 'POST' })
}

/** POST /jobs/applications/:appId/reject-hire — employee rejects employment offer */
export async function rejectHireInvite(appId) {
  return authRequest(`/jobs/applications/${appId}/reject-hire`, { method: 'POST' })
}

/** Fetch a CV file as a Blob for in-page viewing */
export async function fetchCvBlob(filename) {
  const res = await authFetch(`/jobs/cv/${encodeURIComponent(filename)}`)
  return res.blob()
}
