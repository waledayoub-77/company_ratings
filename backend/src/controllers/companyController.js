// Company Controller - HTTP handlers for company endpoints
const companyService = require('../services/companyService');

/**
 * GET /companies
 * List all companies with filters and pagination
 */
const getCompanies = async (req, res, next) => {
  try {
    const filters = {
      industry: req.query.industry,
      location: req.query.location,
      minRating: req.query.minRating,
      search: req.query.search,
      page: req.query.page || 1,
      limit: req.query.limit || 10,
      sortBy: req.query.sortBy || 'created_at',
      sortOrder: req.query.sortOrder || 'desc'
    };

    const result = await companyService.getCompanies(filters);

    res.status(200).json({
      success: true,
      data: result.companies,
      pagination: result.pagination
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /companies/:id
 * Get single company by ID
 */
const getCompanyById = async (req, res, next) => {
  try {
    const company = await companyService.getCompanyById(req.params.id);

    res.status(200).json({
      success: true,
      data: company
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /companies
 * Create new company
 */
const createCompany = async (req, res, next) => {
  try {
    const company = await companyService.createCompany(
      req.body,
      req.user.userId
    );

    res.status(201).json({
      success: true,
      message: 'Company created successfully',
      data: company
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /companies/:id
 * Update company details
 */
const updateCompany = async (req, res, next) => {
  try {
    const company = await companyService.updateCompany(
      req.params.id,
      req.body,
      req.user.userId,
      req.user.role
    );

    res.status(200).json({
      success: true,
      message: 'Company updated successfully',
      data: company
    });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /companies/:id
 * Soft delete company
 */
const deleteCompany = async (req, res, next) => {
  try {
    const result = await companyService.deleteCompany(
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
 * GET /companies/:id/stats
 * Get company statistics
 */
const getCompanyStats = async (req, res, next) => {
  try {
    const stats = await companyService.getCompanyStats(req.params.id);

    res.status(200).json({
      success: true,
      data: stats
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /companies/:id/analytics (Days 3-4)
 * Get company analytics (rating distribution, reviews over time)
 */
const getCompanyAnalytics = async (req, res, next) => {
  try {
    const analytics = await companyService.getCompanyAnalytics(req.params.id);

    res.status(200).json({
      success: true,
      data: analytics
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getCompanies,
  getCompanyById,
  createCompany,
  updateCompany,
  deleteCompany,
  getCompanyStats,
  getCompanyAnalytics
};
