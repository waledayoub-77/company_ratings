// Company Controller - AYA's Module
// Handles HTTP requests for company endpoints

const companyService = require('../services/companyService');

/**
 * GET /api/companies
 * Get all companies with filters and pagination
 */
const getAllCompanies = async (req, res, next) => {
  try {
    const filters = {
      query: req.query.query,
      industry: req.query.industry,
      location: req.query.location,
      minRating: req.query.minRating ? parseFloat(req.query.minRating) : undefined,
      maxRating: req.query.maxRating ? parseFloat(req.query.maxRating) : undefined,
      sortBy: req.query.sortBy,
      sortOrder: req.query.sortOrder,
      page: req.query.page ? parseInt(req.query.page) : 1,
      limit: req.query.limit ? parseInt(req.query.limit) : 10
    };

    const result = await companyService.getCompanies(filters);

    res.status(200).json({
      success: true,
      data: result.companies,
      pagination: {
        total: result.total,
        page: result.page,
        totalPages: result.totalPages,
        limit: filters.limit
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/companies/:id
 * Get a single company by ID
 */
const getCompany = async (req, res, next) => {
  try {
    const { id } = req.params;
    const company = await companyService.getCompanyById(id);

    if (!company) {
      return res.status(404).json({
        success: false,
        message: 'Company not found'
      });
    }

    res.status(200).json({
      success: true,
      data: company
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/companies/:id/stats
 * Get company statistics
 */
const getCompanyStats = async (req, res, next) => {
  try {
    const { id } = req.params;
    const stats = await companyService.getCompanyStats(id);

    res.status(200).json({
      success: true,
      data: stats
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/companies
 * Create a new company (admin only)
 */
const createCompany = async (req, res, next) => {
  try {
    const { name, industry, location, description, logo_url, website } = req.body;
    const userId = req.user.userId;

    if (!name || !industry || !location) {
      return res.status(400).json({
        success: false,
        message: 'Name, industry, and location are required'
      });
    }

    const newCompany = await companyService.createCompany(
      { name, industry, location, description, logo_url, website },
      userId
    );

    res.status(201).json({
      success: true,
      message: 'Company created successfully',
      data: newCompany
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/companies/:id
 * Update an existing company (admin only)
 */
const updateCompany = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;
    const updateData = req.body;

    const updatedCompany = await companyService.updateCompany(id, updateData, userId);

    if (!updatedCompany) {
      return res.status(404).json({
        success: false,
        message: 'Company not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Company updated successfully',
      data: updatedCompany
    });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/companies/:id
 * Soft delete a company (admin only)
 */
const deleteCompany = async (req, res, next) => {
  try {
    const { id } = req.params;
    const success = await companyService.deleteCompany(id);

    if (!success) {
      return res.status(404).json({
        success: false,
        message: 'Company not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Company deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllCompanies,
  getCompany,
  getCompanyStats,
  createCompany,
  updateCompany,
  deleteCompany
};
