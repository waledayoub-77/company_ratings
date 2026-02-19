// Review Controller - AYA's Module
// Handles HTTP requests for review endpoints

const reviewService = require('../services/reviewService');

/**
 * POST /api/reviews
 * Create a new review
 */
const createReview = async (req, res, next) => {
  try {
    const { companyId, overallRating, content, isAnonymous } = req.body;
    const employeeId = req.user.employeeId;

    if (!employeeId) {
      return res.status(403).json({
        success: false,
        message: 'You must be registered as an employee to submit reviews'
      });
    }

    if (!companyId || !overallRating || !content) {
      return res.status(400).json({
        success: false,
        message: 'Company ID, rating, and content are required'
      });
    }

    if (overallRating < 1 || overallRating > 5) {
      return res.status(400).json({
        success: false,
        message: 'Rating must be between 1 and 5'
      });
    }

    if (content.length < 50 || content.length > 2000) {
      return res.status(400).json({
        success: false,
        message: 'Review content must be between 50 and 2000 characters'
      });
    }

    const newReview = await reviewService.createReview(
      { companyId, overallRating, content, isAnonymous },
      employeeId
    );

    res.status(201).json({
      success: true,
      message: 'Review submitted successfully',
      data: newReview
    });
  } catch (error) {
    if (error.message.includes('verified employment') || error.message.includes('already reviewed')) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }
    next(error);
  }
};

/**
 * PATCH /api/reviews/:id
 * Update a review (within 48hr window)
 */
const updateReview = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { overallRating, content } = req.body;
    const employeeId = req.user.employeeId;

    if (!employeeId) {
      return res.status(403).json({
        success: false,
        message: 'You must be registered as an employee'
      });
    }

    if (overallRating && (overallRating < 1 || overallRating > 5)) {
      return res.status(400).json({
        success: false,
        message: 'Rating must be between 1 and 5'
      });
    }

    if (content && (content.length < 50 || content.length > 2000)) {
      return res.status(400).json({
        success: false,
        message: 'Review content must be between 50 and 2000 characters'
      });
    }

    const updatedReview = await reviewService.updateReview(id, { overallRating, content }, employeeId);

    if (!updatedReview) {
      return res.status(404).json({
        success: false,
        message: 'Review not found or you do not have permission to edit it'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Review updated successfully',
      data: updatedReview
    });
  } catch (error) {
    if (error.message.includes('Edit window')) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }
    next(error);
  }
};

/**
 * DELETE /api/reviews/:id
 * Soft delete a review
 */
const deleteReview = async (req, res, next) => {
  try {
    const { id } = req.params;
    const employeeId = req.user.employeeId;

    if (!employeeId) {
      return res.status(403).json({
        success: false,
        message: 'You must be registered as an employee'
      });
    }

    const success = await reviewService.deleteReview(id, employeeId);

    if (!success) {
      return res.status(404).json({
        success: false,
        message: 'Review not found or you do not have permission to delete it'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Review deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/reviews/company/:companyId
 * Get all reviews for a company
 */
const getCompanyReviews = async (req, res, next) => {
  try {
    const { companyId } = req.params;
    const options = {
      page: req.query.page ? parseInt(req.query.page) : 1,
      limit: req.query.limit ? parseInt(req.query.limit) : 10,
      sortBy: req.query.sortBy || 'created_at',
      sortOrder: req.query.sortOrder || 'desc'
    };

    const result = await reviewService.getCompanyReviews(companyId, options);

    res.status(200).json({
      success: true,
      data: result.reviews,
      pagination: {
        total: result.total,
        page: result.page,
        totalPages: result.totalPages,
        limit: options.limit
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/reviews/my-reviews
 * Get current user's reviews
 */
const getMyReviews = async (req, res, next) => {
  try {
    const employeeId = req.user.employeeId;

    if (!employeeId) {
      return res.status(403).json({
        success: false,
        message: 'You must be registered as an employee'
      });
    }

    const reviews = await reviewService.getMyReviews(employeeId);

    res.status(200).json({
      success: true,
      data: reviews
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/reviews/:id
 * Get a single review by ID
 */
const getReview = async (req, res, next) => {
  try {
    const { id } = req.params;
    const review = await reviewService.getReviewById(id);

    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found'
      });
    }

    res.status(200).json({
      success: true,
      data: review
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/reviews/:id/report
 * Report a review
 */
const reportReview = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const reporterId = req.user.userId;

    if (!reason || reason.length < 10) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a reason for the report (minimum 10 characters)'
      });
    }

    const report = await reviewService.reportReview(id, reporterId, reason);

    res.status(201).json({
      success: true,
      message: 'Report submitted successfully',
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
  getReview,
  reportReview
};
