const express = require("express");
const router = express.Router();
const companyController = require('../controllers/companyController');
const reviewController = require('../controllers/reviewController');
const { requireAuth, optionalAuth } = require('../middlewares/authMiddleware');
const { requireRole, requireCompanyAdmin } = require('../middlewares/roleMiddleware');

/**
 * Public routes (no auth required)
 */

// GET /companies - List all companies with filters
router.get(
  '/',
  companyController.getCompanies
);

// GET /companies/filter-options - Get distinct country/city for dropdowns
router.get(
  '/filter-options',
  companyController.getFilterOptions
);

// GET /companies/platform-stats - Get platform-wide stats for landing page
router.get(
  '/platform-stats',
  companyController.getPlatformStats
);

// GET /companies/:id - Get single company
router.get(
  '/:id',
  companyController.getCompanyById
);

// GET /companies/:companyId/reviews - Get all reviews for a company (Days 3-4)
router.get(
  '/:companyId/reviews',
  optionalAuth,
  reviewController.getCompanyReviews
);

// GET /companies/:id/analytics - Get company analytics (Days 3-4)
router.get(
  '/:id/analytics',
  companyController.getCompanyAnalytics
);

// GET /companies/:id/employees - List approved employees at a company (for feedback)
router.get(
  '/:id/employees',
  requireAuth,
  companyController.getCompanyEmployees
);

// GET /companies/:id/stats - Get company statistics
router.get(
  '/:id/stats',
  companyController.getCompanyStats
);

/**
 * Protected routes (auth required)
 */

// POST /companies - Create company (company_admin only)
router.post(
  '/',
  requireAuth,
  requireCompanyAdmin,
  companyController.createCompany
);

// PATCH /companies/:id - Update company (creator or admin)
router.patch(
  '/:id',
  requireAuth,
  companyController.updateCompany
);

// DELETE /companies/:id - Delete company (creator or admin)
router.delete(
  '/:id',
  requireAuth,
  companyController.deleteCompany
);

module.exports = router;