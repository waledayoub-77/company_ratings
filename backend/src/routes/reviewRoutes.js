const express = require("express");
const router = express.Router();
const reviewController = require('../controllers/reviewController');
const reviewInteractionController = require('../controllers/reviewInteractionController');
const { requireAuth, optionalAuth } = require('../middlewares/authMiddleware');
const { requireEmployee } = require('../middlewares/roleMiddleware');
const { validateReview } = require('../utils/validators');
const { validate } = require('../middlewares/validateMiddleware');

/**
 * All review routes require authentication
 */

// POST /reviews - Create new review (employee only)
router.post(
  '/',
  requireAuth,
  requireEmployee,
  validateReview,
  validate,
  reviewController.createReview
);

// GET /reviews/my-reviews - Get current user's reviews (Days 3-4)
router.get(
  '/my-reviews',
  requireAuth,
  reviewController.getMyReviews
);

// GET /reviews/:id - Get single review
router.get(
  '/:id',
  reviewController.getReviewById
);

// PATCH /reviews/:id - Update review within 48h (Days 3-4)
router.patch(
  '/:id',
  requireAuth,
  reviewController.updateReview
);

// DELETE /reviews/:id - Delete review
router.delete(
  '/:id',
  requireAuth,
  reviewController.deleteReview
);

// ─── Review Interactions ──────────────────────────────────────────────────────
// POST /reviews/:id/reply - Company admin replies to review
router.post('/:id/reply', requireAuth, reviewInteractionController.createReply);

// PATCH /reviews/replies/:id - Update a reply
router.patch('/replies/:id', requireAuth, reviewInteractionController.updateReply);

// DELETE /reviews/replies/:id - Delete a reply
router.delete('/replies/:id', requireAuth, reviewInteractionController.deleteReply);

// POST /reviews/:id/vote - Toggle helpful/unhelpful vote
router.post('/:id/vote', requireAuth, reviewInteractionController.toggleVote);

// GET /reviews/:id/category-ratings - Get category ratings for a review
router.get('/:id/category-ratings', reviewInteractionController.getCategoryRatings);

module.exports = router;