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

/**
 * GET /companies/:id/employees
 * Get approved employees at a company (for peer feedback coworker picker)
 * Requires auth — excludes the requesting user
 */
const getCompanyEmployees = async (req, res, next) => {
  try {
    const companyId = req.params.id;
    const userId = req.user?.userId;

    const supabase = require('../config/database');

    // Get requesting user's employee id to exclude them
    const { data: selfEmployee } = await supabase
      .from('employees')
      .select('id')
      .eq('user_id', userId)
      .is('deleted_at', null)
      .maybeSingle();

    // Get all approved employments at this company with employee details
    // employees!inner excludes rows where the employee row is soft-deleted
    let query = supabase
      .from('employments')
      .select('employee_id, position, department, employees!inner(id, full_name, current_position, deleted_at)')
      .eq('company_id', companyId)
      .eq('verification_status', 'approved')
      .eq('is_current', true)
      .is('deleted_at', null)
      .is('employees.deleted_at', null);

    // Exclude self
    if (selfEmployee) {
      query = query.neq('employee_id', selfEmployee.id);
    }

    const { data, error } = await query;
    if (error) throw error;

    // Flatten and deduplicate by employee_id
    const seen = new Set();
    const employees = (data || [])
      .filter(row => {
        if (seen.has(row.employee_id)) return false;
        seen.add(row.employee_id);
        return true;
      })
      .map(row => ({
        id: row.employee_id,
        fullName: row.employees?.full_name || 'Unknown',
        position: row.position || row.employees?.current_position || '',
        department: row.department || '',
      }));

    res.status(200).json({ success: true, data: employees });
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
  getCompanyAnalytics,
  getCompanyEmployees
};
