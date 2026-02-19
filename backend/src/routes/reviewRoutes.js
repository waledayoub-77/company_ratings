// Review Routes - AYA's Module
// Defines API endpoints for reviews

const express = require('express');
const router = express.Router();
const reviewController = require('../controllers/reviewController');
const { requireAuth } = require('../middlewares/authMiddleware');
const { requireEmployee } = require('../middlewares/roleMiddleware');

// Public routes

// GET /api/reviews/company/:companyId - Get all reviews for a company
router.get('/company/:companyId', reviewController.getCompanyReviews);

// GET /api/reviews/:id - Get single review by ID
router.get('/:id', reviewController.getReview);

// Protected routes (auth required)

// GET /api/reviews/my-reviews - Get current user's reviews
router.get('/my-reviews', requireAuth, requireEmployee, reviewController.getMyReviews);

// POST /api/reviews - Create new review
router.post('/', requireAuth, requireEmployee, reviewController.createReview);

// PATCH /api/reviews/:id - Update review (within 48hr window)
router.patch('/:id', requireAuth, requireEmployee, reviewController.updateReview);

// DELETE /api/reviews/:id - Delete review
router.delete('/:id', requireAuth, requireEmployee, reviewController.deleteReview);

// POST /api/reviews/:id/report - Report a review
router.post('/:id/report', requireAuth, reviewController.reportReview);

module.exports = router;
