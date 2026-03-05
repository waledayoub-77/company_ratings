// Feature 5: Job Positions + Applications API
import { authRequest, request } from './client'

// ─── Positions ────────────────────────────────────────────────────────────────

export async function getCompanyPositions(companyId) {
  return request(`/jobs/company/${companyId}`)
}

export async function createPosition(data) {
  return authRequest('/jobs', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export async function updatePosition(id, data) {
  return authRequest(`/jobs/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  })
}

export async function deletePosition(id, companyId) {
  return authRequest(`/jobs/${id}`, {
    method: 'DELETE',
    body: JSON.stringify({ companyId }),
  })
}

// ─── Applications ─────────────────────────────────────────────────────────────

/**
 * Apply to a position — supports FormData for CV upload
 */
export async function applyToPosition(formData) {
  const token = localStorage.getItem('rh_access')
  const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'
  const res = await fetch(`${baseUrl}/jobs/apply`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
  })
  return res.json()
}

export async function getMyApplications() {
  return authRequest('/jobs/my-applications')
}

export async function getApplicationsForPosition(positionId, companyId) {
  return authRequest(`/jobs/${positionId}/applications?companyId=${companyId}`)
}

export async function updateApplicationStatus(applicationId, data) {
  return authRequest(`/jobs/applications/${applicationId}/status`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  })
}
