import { authRequest, request } from './client'

/** POST /eotm/events */
export async function createEotmEvent(data) {
  return authRequest('/eotm/events', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

/** POST /eotm/events/:id/vote */
export async function castEotmVote(eventId, nomineeId) {
  return authRequest(`/eotm/events/${eventId}/vote`, {
    method: 'POST',
    body: JSON.stringify({ nomineeId }),
  })
}

/** PATCH /eotm/events/:id/close */
export async function closeEotmEvent(eventId) {
  return authRequest(`/eotm/events/${eventId}/close`, { method: 'PATCH' })
}

/** GET /eotm/company/:companyId */
export async function getCompanyEotmEvents(companyId) {
  return authRequest(`/eotm/company/${companyId}`)
}

/** GET /eotm/events/:id/nominees */
export async function getEotmNominees(eventId) {
  return authRequest(`/eotm/events/${eventId}/nominees`)
}

/** GET /eotm/company/:companyId/winners */
export async function getCompanyEotmWinners(companyId) {
  return request(`/eotm/company/${companyId}/winners`)
}
