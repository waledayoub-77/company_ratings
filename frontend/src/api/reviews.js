import { authRequest, request } from './client'

/**
 * POST /reviews
 * @param {Object} data — companyId, rating, reviewText, isAnonymous
 */
export async function createReview(data) {
  return authRequest('/reviews', {
    method: 'POST',
    body:   JSON.stringify(data),
  })
}

/**
 * GET /reviews/my-reviews
 */
export async function getMyReviews() {
  return authRequest('/reviews/my-reviews')
}

/**
 * GET /reviews/:id
 */
export async function getReviewById(id) {
  return request(`/reviews/${id}`)
}

/**
 * PATCH /reviews/:id
 * @param {Object} data — rating, reviewText, isAnonymous
 */
export async function updateReview(id, data) {
  return authRequest(`/reviews/${id}`, {
    method: 'PATCH',
    body:   JSON.stringify(data),
  })
}

/**
 * DELETE /reviews/:id
 */
export async function deleteReview(id) {
  return authRequest(`/reviews/${id}`, { method: 'DELETE' })
}
