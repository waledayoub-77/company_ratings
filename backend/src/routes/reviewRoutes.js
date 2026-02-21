const express = require("express");
const router = express.Router();
const reviewController = require('../controllers/reviewController');
const { requireAuth } = require('../middlewares/authMiddleware');
const { requireEmployee } = require('../middlewares/roleMiddleware');

/**
 * All review routes require authentication
 */

// POST /reviews - Create new review (employee only)
router.post(
  '/',
  requireAuth,
  requireEmployee,
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

// POST /reviews/:id/report - Report a review
router.post(
  '/:id/report',
  requireAuth,
  reviewController.reportReview
);

module.exports = router;