import { authRequest } from './client'

// ─── User-facing verification ─────────────────────────────────────────────────

/** POST /verification/upload-id */
export async function submitIdentityVerification(data) {
  return authRequest('/verification/upload-id', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

/** POST /verification/upload-company-doc */
export async function submitCompanyVerification(data) {
  return authRequest('/verification/upload-company-doc', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

/** GET /verification/status */
export async function getVerificationStatus() {
  return authRequest('/verification/status')
}

// ─── Admin verification management ───────────────────────────────────────────

/** GET /verification/admin/requests */
export async function getVerificationRequests(params = {}) {
  const qs = new URLSearchParams(params).toString()
  return authRequest(`/verification/admin/requests${qs ? `?${qs}` : ''}`)
}

/** PATCH /verification/admin/:id/approve */
export async function approveVerification(id, adminNotes) {
  return authRequest(`/verification/admin/${id}/approve`, {
    method: 'PATCH',
    body: JSON.stringify({ adminNotes }),
  })
}

/** PATCH /verification/admin/:id/reject */
export async function rejectVerification(id, adminNotes) {
  return authRequest(`/verification/admin/${id}/reject`, {
    method: 'PATCH',
    body: JSON.stringify({ adminNotes }),
  })
}
