import { authRequest, request } from './client'

/** POST /eoty/events */
export async function createEotyEvent(data) {
  return authRequest('/eoty/events', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

/** POST /eoty/events/:id/vote */
export async function castEotyVote(eventId, candidateId) {
  return authRequest(`/eoty/events/${eventId}/vote`, {
    method: 'POST',
    body: JSON.stringify({ candidateId }),
  })
}

/** PATCH /eoty/events/:id/close */
export async function closeEotyEvent(eventId) {
  return authRequest(`/eoty/events/${eventId}/close`, { method: 'PATCH' })
}

/** GET /eoty/company/:companyId */
export async function getCompanyEotyEvents(companyId) {
  return authRequest(`/eoty/company/${companyId}`)
}

/** GET /eoty/events/:id/nominees */
export async function getEotyNominees(eventId) {
  return authRequest(`/eoty/events/${eventId}/nominees`)
}

/** GET /eoty/company/:companyId/winners */
export async function getCompanyEotyWinners(companyId) {
  return request(`/eoty/company/${companyId}/winners`)
}
