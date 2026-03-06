// Company Service - Business logic for companies
const supabase = require('../config/database');
const { AppError } = require('../middlewares/errorHandler');
const { sanitizeSearch } = require('../middlewares/sanitize');

/**
 * Get all companies with filters, search, and pagination
 * Supports: industry filter, location search, rating filter, pagination
 */
const getCompanies = async (filters = {}) => {
  const {
    industry,
    location,
    country,
    city,
    minRating,
    search,
    sortBy = 'created_at',
    sortOrder = 'desc'
  } = filters;

  // Day 6: Clamp pagination inputs — guard against page=0 or negative
  const limit = Math.max(1, parseInt(filters.limit) || 10);
  const page = Math.max(1, parseInt(filters.page) || 1);

  // Build base query for reuse
  const buildBaseQuery = () => {
    let q = supabase
      .from('companies')
      .select('*', { count: 'exact' })
      .is('deleted_at', null);
    if (industry) q = q.eq('industry', industry);
    if (location) {
      const safeLocation = sanitizeSearch(location);
      if (safeLocation) q = q.ilike('location', `%${safeLocation}%`);
    }
    if (country) {
      const safeCountry = sanitizeSearch(country);
      if (safeCountry) q = q.ilike('country', `%${safeCountry}%`);
    }
    if (city) {
      const safeCity = sanitizeSearch(city);
      if (safeCity) q = q.ilike('city', `%${safeCity}%`);
    }
    if (minRating) q = q.gte('overall_rating', parseFloat(minRating));
    if (search) {
      const safeSearch = sanitizeSearch(search);
      if (safeSearch) q = q.or(`name.ilike.%${safeSearch}%,description.ilike.%${safeSearch}%`);
    }
    return q;
  };

  // Step 1: Get total count first
  const { count, error: countError } = await buildBaseQuery().limit(0);
  if (countError) {
    console.error('❌ Supabase error in getCompanies (count):', countError);
    throw new AppError('Failed to fetch companies', 500);
  }

  const totalPages = count > 0 ? Math.ceil(count / limit) : 1;

  // Day 6: Handle page > totalPages gracefully — return empty instead of crashing
  if (page > totalPages) {
    return {
      companies: [],
      pagination: {
        total: count,
        page,
        limit,
        totalPages,
        message: `Page ${page} exceeds total pages (${totalPages})`
      }
    };
  }

  // Step 2: Fetch data for valid page
  const validSortBy = ['created_at', 'name', 'overall_rating', 'total_reviews'];
  const sortField = validSortBy.includes(sortBy) ? sortBy : 'created_at';
  const offset = (page - 1) * limit;

  const { data, error } = await buildBaseQuery()
    .order(sortField, { ascending: sortOrder === 'asc' })
    .range(offset, offset + limit - 1);

  if (error) {
    console.error('❌ Supabase error in getCompanies:', error);
    throw new AppError('Failed to fetch companies', 500);
  }

  return {
    companies: data,
    pagination: {
      total: count,
      page,
      limit,
      totalPages
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
 * Day 6: Cascade soft-deletes all reviews for this company
 */
const deleteCompany = async (companyId, userId, userRole) => {
  const company = await getCompanyById(companyId);

  // Check permissions
  if (company.user_id !== userId && userRole !== 'system_admin') {
    throw new AppError('You do not have permission to delete this company', 403);
  }

  const now = new Date().toISOString();

  // Day 6: Cascade soft-delete all reviews for this company first
  const { error: reviewsError } = await supabase
    .from('company_reviews')
    .update({ deleted_at: now })
    .eq('company_id', companyId)
    .is('deleted_at', null);

  if (reviewsError) {
    console.error('❌ Supabase error cascade-deleting reviews:', reviewsError);
    throw new AppError('Failed to cascade-delete company reviews', 500);
  }

  // Now soft-delete the company itself
  const { error } = await supabase
    .from('companies')
    .update({ deleted_at: now })
    .eq('id', companyId);

  if (error) {
    console.error('❌ Supabase error in deleteCompany:', error);
    throw new AppError('Failed to delete company', 500);
  }

  return { message: 'Company and all associated reviews deleted successfully' };
};

/**
 * Get company statistics
 */
const getCompanyStats = async (companyId) => {
  await getCompanyById(companyId); // Verify company exists

  // 1) Review stats from RPC
  const { data, error } = await supabase
    .rpc('get_company_stats', { p_company_id: companyId });

  if (error) {
    console.error('❌ Supabase error in getCompanyStats:', error);
    throw new AppError('Failed to fetch company statistics', 500);
  }

  // RPC returns an array of one row — normalise
  const stats = Array.isArray(data) ? (data[0] || {}) : (data || {});

  // 2) Count verified (approved + current) employees, excluding deleted users
  const { count: totalEmployees } = await supabase
    .from('employments')
    .select('id', { count: 'exact', head: true })
    .eq('company_id', companyId)
    .eq('verification_status', 'approved')
    .eq('is_current', true)
    .is('deleted_at', null);

  // 3) Average feedback score across all non-deleted feedback for this company
  const { data: fbRows } = await supabase
    .from('employee_feedback')
    .select('professionalism, communication, teamwork, reliability')
    .eq('company_id', companyId)
    .is('deleted_at', null);

  let avgFeedbackScore = null;
  if (fbRows && fbRows.length > 0) {
    const total = fbRows.reduce((sum, f) => {
      return sum + (f.professionalism + f.communication + f.teamwork + f.reliability) / 4;
    }, 0);
    avgFeedbackScore = Number((total / fbRows.length).toFixed(2));
  }

  return {
    ...stats,
    total_employees: totalEmployees || 0,
    avg_feedback_score: avgFeedbackScore,
  };
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

/**
 * Get distinct country/city values for filter dropdowns
 */
const getFilterOptions = async () => {
  const { data, error } = await supabase
    .from('companies')
    .select('country, city')
    .is('deleted_at', null);

  if (error) {
    console.error('❌ Supabase error in getFilterOptions:', error);
    throw new AppError('Failed to fetch filter options', 500);
  }

  const countries = [...new Set((data || []).map(c => c.country).filter(Boolean))].sort();
  const cities = [...new Set((data || []).map(c => c.city).filter(Boolean))].sort();

  // Build country→cities map
  const citiesByCountry = {};
  (data || []).forEach(c => {
    if (c.country && c.city) {
      if (!citiesByCountry[c.country]) citiesByCountry[c.country] = new Set();
      citiesByCountry[c.country].add(c.city);
    }
  });
  const citiesByCountryObj = {};
  for (const [k, v] of Object.entries(citiesByCountry)) {
    citiesByCountryObj[k] = [...v].sort();
  }

  return { countries, cities, citiesByCountry: citiesByCountryObj };
};

module.exports = {
  getCompanies,
  getCompanyById,
  createCompany,
  updateCompany,
  deleteCompany,
  getCompanyStats,
  getCompanyAnalytics,
  getFilterOptions
};
