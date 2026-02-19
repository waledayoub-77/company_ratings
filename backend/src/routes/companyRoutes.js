// Company Routes - AYA's Module
// Defines API endpoints for companies

const express = require('express');
const router = express.Router();
const companyController = require('../controllers/companyController');
const { requireAuth } = require('../middlewares/authMiddleware');
const { requireSystemAdmin } = require('../middlewares/roleMiddleware');

// Public routes (no auth required)

// GET /api/companies - List all companies with filters and pagination
router.get('/', companyController.getAllCompanies);

// GET /api/companies/:id - Get single company by ID
router.get('/:id', companyController.getCompany);

// GET /api/companies/:id/stats - Get company statistics
router.get('/:id/stats', companyController.getCompanyStats);

// Protected routes (auth required)

// POST /api/companies - Create new company (system admin only)
router.post('/', requireAuth, requireSystemAdmin, companyController.createCompany);

// PATCH /api/companies/:id - Update company (system admin only)
router.patch('/:id', requireAuth, requireSystemAdmin, companyController.updateCompany);

// DELETE /api/companies/:id - Delete company (system admin only)
router.delete('/:id', requireAuth, requireSystemAdmin, companyController.deleteCompany);

module.exports = router;
