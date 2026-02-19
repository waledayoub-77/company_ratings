// Company Service - AYA's Module
// Business logic for company operations

const { supabase } = require('../config/database');

/**
 * Get all companies with filters, search, and pagination
 * @param {Object} filters - Query filters
 * @returns {Object} { companies, total, page, totalPages }
 */
const getCompanies = async (filters = {}) => {
  const {
    query,
    industry,
    location,
    minRating,
    maxRating,
    sortBy = 'created_at',
    sortOrder = 'desc',
    page = 1,
    limit = 10
  } = filters;

  const offset = (page - 1) * limit;

  let dbQuery = supabase
    .from('companies')
    .select('*', { count: 'exact' })
    .is('deleted_at', null);

  // Search by name
  if (query) {
    dbQuery = dbQuery.ilike('name', `%${query}%`);
  }

  // Filter by industry
  if (industry) {
    dbQuery = dbQuery.eq('industry', industry);
  }

  // Filter by location
  if (location) {
    dbQuery = dbQuery.ilike('location', `%${location}%`);
  }

  // Filter by rating range
  if (minRating !== undefined) {
    dbQuery = dbQuery.gte('overall_rating', minRating);
  }
  if (maxRating !== undefined) {
    dbQuery = dbQuery.lte('overall_rating', maxRating);
  }

  // Sorting
  const validSortFields = ['name', 'overall_rating', 'total_reviews', 'created_at'];
  const sortField = validSortFields.includes(sortBy) ? sortBy : 'created_at';
  dbQuery = dbQuery.order(sortField, { ascending: sortOrder === 'asc' });

  // Pagination
  dbQuery = dbQuery.range(offset, offset + limit - 1);

  const { data, error, count } = await dbQuery;

  if (error) {
    throw new Error(`Failed to fetch companies: ${error.message}`);
  }

  return {
    companies: data,
    total: count,
    page: parseInt(page),
    totalPages: Math.ceil(count / limit)
  };
};

/**
 * Get a single company by ID
 * @param {string} id - Company UUID
 * @returns {Object} Company data or null
 */
const getCompanyById = async (id) => {
  const { data, error } = await supabase
    .from('companies')
    .select('*')
    .eq('id', id)
    .is('deleted_at', null)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw new Error(`Failed to fetch company: ${error.message}`);
  }

  return data;
};

/**
 * Create a new company
 * @param {Object} data - Company data
 * @param {string} userId - User ID creating the company
 * @returns {Object} Created company
 */
const createCompany = async (data, userId) => {
  const companyData = {
    user_id: userId,
    name: data.name,
    industry: data.industry,
    location: data.location,
    description: data.description || null,
    logo_url: data.logo_url || null,
    website: data.website || null,
    overall_rating: 0.0,
    total_reviews: 0,
    is_verified: false
  };

  const { data: newCompany, error } = await supabase
    .from('companies')
    .insert(companyData)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create company: ${error.message}`);
  }

  return newCompany;
};

/**
 * Update an existing company
 * @param {string} id - Company UUID
 * @param {Object} data - Fields to update
 * @param {string} userId - User ID making the update
 * @returns {Object} Updated company or null
 */
const updateCompany = async (id, data, userId) => {
  const existingCompany = await getCompanyById(id);
  if (!existingCompany) return null;

  const allowedFields = ['name', 'industry', 'location', 'description', 'logo_url', 'website'];
  const updateData = {};

  for (const field of allowedFields) {
    if (data[field] !== undefined) {
      updateData[field] = data[field];
    }
  }

  updateData.updated_at = new Date().toISOString();

  const { data: updatedCompany, error } = await supabase
    .from('companies')
    .update(updateData)
    .eq('id', id)
    .is('deleted_at', null)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update company: ${error.message}`);
  }

  return updatedCompany;
};

/**
 * Soft delete a company
 * @param {string} id - Company UUID
 * @returns {boolean} Success
 */
const deleteCompany = async (id) => {
  const { error } = await supabase
    .from('companies')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id)
    .is('deleted_at', null);

  if (error) {
    throw new Error(`Failed to delete company: ${error.message}`);
  }

  return true;
};

/**
 * Get company statistics
 * @param {string} id - Company UUID
 * @returns {Object} Company stats
 */
const getCompanyStats = async (id) => {
  const { data, error } = await supabase
    .rpc('get_company_stats', { company_uuid: id });

  if (error) {
    throw new Error(`Failed to get company stats: ${error.message}`);
  }

  return data;
};

module.exports = {
  getCompanies,
  getCompanyById,
  createCompany,
  updateCompany,
  deleteCompany,
  getCompanyStats
};
