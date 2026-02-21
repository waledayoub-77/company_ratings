// Company Service - Business logic for companies
const supabase = require('../config/database');
const { AppError } = require('../middlewares/errorHandler');

/**
 * Get all companies with filters, search, and pagination
 * Supports: industry filter, location search, rating filter, pagination
 */
const getCompanies = async (filters = {}) => {
  const {
    industry,
    location,
    minRating,
    search,
    page = 1,
    limit = 10,
    sortBy = 'created_at',
    sortOrder = 'desc'
  } = filters;

  let query = supabase
    .from('companies')
    .select('*', { count: 'exact' })
    .is('deleted_at', null);

  // Apply filters
  if (industry) {
    query = query.eq('industry', industry);
  }

  if (location) {
    query = query.ilike('location', `%${location}%`);
  }

  if (minRating) {
    query = query.gte('overall_rating', parseFloat(minRating));
  }

  // Search by company name or description
  if (search) {
    query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`);
  }

  // Sorting
  query = query.order(sortBy, { ascending: sortOrder === 'asc' });

  // Pagination
  const offset = (page - 1) * limit;
  query = query.range(offset, offset + limit - 1);

  const { data, error, count } = await query;

  if (error) {
    console.error('❌ Supabase error in getCompanies:', error);
    throw new AppError('Failed to fetch companies', 500);
  }

  return {
    companies: data,
    pagination: {
      total: count,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(count / limit)
    }
  };
};

/**
 * Get single company by ID
 */
const getCompanyById = async (companyId) => {
  const { data, error } = await supabase
    .from('companies')
    .select('*')
    .eq('id', companyId)
    .is('deleted_at', null)
    .single();

  if (error || !data) {
    throw new AppError('Company not found', 404);
  }

  return data;
};

/**
 * Create new company
 * Only company_admin users can create companies
 */
const createCompany = async (companyData, userId) => {
  const { name, description, industry, location, website, logo_url } = companyData;

  // Check if company name already exists
  const { data: existing } = await supabase
    .from('companies')
    .select('id')
    .eq('name', name)
    .is('deleted_at', null)
    .single();

  if (existing) {
    throw new AppError('Company with this name already exists', 400);
  }

  // Create company
  const { data, error } = await supabase
    .from('companies')
    .insert({
      user_id: userId,
      name,
      description,
      industry,
      location,
      website,
      logo_url
    })
    .select()
    .single();

  if (error) {
    console.error('❌ Supabase error in createCompany:', error);
    throw new AppError('Failed to create company', 500);
  }

  return data;
};

/**
 * Update company details
 * Only creator or system admin can update
 */
const updateCompany = async (companyId, updates, userId, userRole) => {
  // Get company
  const company = await getCompanyById(companyId);

  // Check permissions (creator or system admin)
  if (company.user_id !== userId && userRole !== 'system_admin') {
    throw new AppError('You do not have permission to update this company', 403);
  }

  const { name, description, industry, location, website, logo_url } = updates;

  // If changing name, check for duplicates
  if (name && name !== company.name) {
    const { data: existing } = await supabase
      .from('companies')
      .select('id')
      .eq('name', name)
      .is('deleted_at', null)
      .neq('id', companyId)
      .single();

    if (existing) {
      throw new AppError('Company with this name already exists', 400);
    }
  }

  const { data, error } = await supabase
    .from('companies')
    .update({
      name,
      description,
      industry,
      location,
      website,
      logo_url
    })
    .eq('id', companyId)
    .select()
    .single();

  if (error) {
    console.error('❌ Supabase error in updateCompany:', error);
    throw new AppError('Failed to update company', 500);
  }

  return data;
};

/**
 * Soft delete company
 * Only creator or system admin can delete
 */
const deleteCompany = async (companyId, userId, userRole) => {
  const company = await getCompanyById(companyId);

  // Check permissions
  if (company.user_id !== userId && userRole !== 'system_admin') {
    throw new AppError('You do not have permission to delete this company', 403);
  }

  const { error } = await supabase
    .from('companies')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', companyId);

  if (error) {
    console.error('❌ Supabase error in deleteCompany:', error);
    throw new AppError('Failed to delete company', 500);
  }

  return { message: 'Company deleted successfully' };
};

/**
 * Get company statistics
 */
const getCompanyStats = async (companyId) => {
  await getCompanyById(companyId); // Verify company exists

  const { data, error } = await supabase
    .rpc('get_company_stats', { p_company_id: companyId });

  if (error) {
    console.error('❌ Supabase error in getCompanyStats:', error);
    throw new AppError('Failed to fetch company statistics', 500);
  }

  return data;
};

/**
 * Get company analytics (Days 3-4)
 * Rating distribution, reviews over time, etc.
 */
const getCompanyAnalytics = async (companyId) => {
  await getCompanyById(companyId); // Verify exists

  // Get rating distribution (how many 1-star, 2-star, etc.)
  const { data: ratingDist, error: ratingError } = await supabase
    .from('company_reviews')
    .select('overall_rating')
    .eq('company_id', companyId)
    .is('deleted_at', null);

  if (ratingError) {
    console.error('❌ Supabase error in getCompanyAnalytics (rating):', ratingError);
    throw new AppError('Failed to fetch rating distribution', 500);
  }

  const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  ratingDist.forEach(r => {
    distribution[r.overall_rating]++;
  });

  // Get reviews over time (monthly breakdown)
  const { data: monthlyReviews, error: monthlyError } = await supabase
    .from('company_reviews')
    .select('created_at')
    .eq('company_id', companyId)
    .is('deleted_at', null)
    .order('created_at', { ascending: true });

  if (monthlyError) {
    console.error('❌ Supabase error in getCompanyAnalytics (monthly):', monthlyError);
    throw new AppError('Failed to fetch monthly reviews', 500);
  }

  // Group by month
  const monthlyData = {};
  monthlyReviews.forEach(review => {
    const date = new Date(review.created_at);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    monthlyData[monthKey] = (monthlyData[monthKey] || 0) + 1;
  });

  return {
    ratingDistribution: distribution,
    reviewsOverTime: monthlyData,
    totalReviews: ratingDist.length
  };
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
