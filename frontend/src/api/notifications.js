import { authRequest } from './client'

/** GET /notifications */
export function getNotifications() {
  return authRequest('/notifications')
}

/** PATCH /notifications/:id/read */
export function markNotificationRead(id) {
  return authRequest(`/notifications/${id}/read`, { method: 'PATCH' })
}

/** PATCH /notifications/read-all */
export function markAllNotificationsRead() {
  return authRequest('/notifications/read-all', { method: 'PATCH' })
}
