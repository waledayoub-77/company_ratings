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

// ─── Review Interactions ──────────────────────────────────────────────────────

/** POST /reviews/:id/reply */
export async function createReviewReply(reviewId, content) {
  return authRequest(`/reviews/${reviewId}/reply`, {
    method: 'POST',
    body: JSON.stringify({ content }),
  })
}

/** PATCH /reviews/replies/:id */
export async function updateReviewReply(replyId, content) {
  return authRequest(`/reviews/replies/${replyId}`, {
    method: 'PATCH',
    body: JSON.stringify({ content }),
  })
}

/** DELETE /reviews/replies/:id */
export async function deleteReviewReply(replyId) {
  return authRequest(`/reviews/replies/${replyId}`, { method: 'DELETE' })
}

/** POST /reviews/:id/vote */
export async function toggleReviewVote(reviewId, voteType = 'helpful') {
  return authRequest(`/reviews/${reviewId}/vote`, {
    method: 'POST',
    body: JSON.stringify({ voteType }),
  })
}

/** GET /reviews/:id/category-ratings */
export async function getReviewCategoryRatings(reviewId) {
  return request(`/reviews/${reviewId}/category-ratings`)
}
