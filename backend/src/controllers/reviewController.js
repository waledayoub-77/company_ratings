// Review Controller - HTTP handlers for review endpoints
const reviewService = require('../services/reviewService');

/**
 * POST /reviews
 * Create a new review (Days 0-2)
 */
const createReview = async (req, res, next) => {
  try {
    const review = await reviewService.createReview(
      req.body,
      req.user.userId
    );

    res.status(201).json({
      success: true,
      message: 'Review submitted successfully',
      data: review
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /reviews/:id
 * Update a review (Days 3-4)
 * Can only edit within 48 hours
 */
const updateReview = async (req, res, next) => {
  try {
    const review = await reviewService.updateReview(
      req.params.id,
      req.body,
      req.user.userId
    );

    res.status(200).json({
      success: true,
      message: 'Review updated successfully',
      data: review
    });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /reviews/:id
 * Soft delete a review
 */
const deleteReview = async (req, res, next) => {
  try {
    const result = await reviewService.deleteReview(
      req.params.id,
      req.user.userId,
      req.user.role
    );

    res.status(200).json({
      success: true,
      message: result.message
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /companies/:companyId/reviews (Days 3-4)
 * Get all reviews for a company with pagination and sorting
 */
const getCompanyReviews = async (req, res, next) => {
  try {
    const filters = {
      page: req.query.page || 1,
      limit: req.query.limit || 10,
      sortBy: req.query.sortBy || 'created_at',
      sortOrder: req.query.sortOrder || 'desc'
    };

    const result = await reviewService.getCompanyReviews(
      req.params.companyId,
      filters
    );

    res.status(200).json({
      success: true,
      data: result.reviews,
      pagination: result.pagination
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /reviews/my-reviews (Days 3-4)
 * Get current user's reviews
 */
const getMyReviews = async (req, res, next) => {
  try {
    const filters = {
      page: req.query.page || 1,
      limit: req.query.limit || 10
    };

    const result = await reviewService.getMyReviews(
      req.user.userId,
      filters
    );

    res.status(200).json({
      success: true,
      data: result.reviews,
      pagination: result.pagination
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /reviews/:id
 * Get single review by ID
 */
const getReviewById = async (req, res, next) => {
  try {
    const review = await reviewService.getReviewById(req.params.id);

    res.status(200).json({
      success: true,
      data: review
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /reviews/:id/report
 * Report a review
 */
const reportReview = async (req, res, next) => {
  try {
    const report = await reviewService.reportReview(
      req.params.id,
      req.body,
      req.user.userId
    );

    res.status(201).json({
      success: true,
      message: 'Review reported successfully',
      data: report
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createReview,
  updateReview,
  deleteReview,
  getCompanyReviews,
  getMyReviews,
  getReviewById,
  reportReview
};

