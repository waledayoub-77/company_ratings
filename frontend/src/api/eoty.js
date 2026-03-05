// Feature 7: Employee of the Year API
import { authRequest } from './client'

export async function createEotyEvent(year) {
  return authRequest('/eoty', {
    method: 'POST',
    body: JSON.stringify({ year }),
  })
}

export async function nominateEmployee(eventId, nomineeEmployeeId) {
  return authRequest('/eoty/nominate', {
    method: 'POST',
    body: JSON.stringify({ eventId, nomineeEmployeeId }),
  })
}

export async function voteEoty(eventId, nomineeId) {
  return authRequest('/eoty/vote', {
    method: 'POST',
    body: JSON.stringify({ eventId, nomineeId }),
  })
}

export async function closeEotyEvent(id) {
  return authRequest(`/eoty/${id}/close`, { method: 'PATCH' })
}

export async function getEotyEvents() {
  return authRequest('/eoty/events')
}

export async function getEotyNominees(eventId) {
  return authRequest(`/eoty/${eventId}/nominees`)
}

export async function getEotyWinners(companyId) {
  return authRequest(`/eoty/winners/${companyId}`)
}

// Feature 9: Get EOTY certificate data
export async function getEotyCertificate(eventId) {
  return authRequest(`/eoty/${eventId}/certificate`)
}

// Get EOTY events for a specific company (for employee dashboard)
export async function getEotyEventsByCompany(companyId) {
  return authRequest(`/eoty/company/${companyId}`)
}
