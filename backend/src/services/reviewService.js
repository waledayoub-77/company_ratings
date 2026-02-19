// Review Service - AYA's Module
// Business logic for review operations

const { supabase } = require('../config/database');

/**
 * Check if employee has verified employment at company
 * @param {string} employeeId - Employee UUID
 * @param {string} companyId - Company UUID
 * @returns {Object|null} Employment record or null
 */
const checkVerifiedEmployment = async (employeeId, companyId) => {
  const { data, error } = await supabase
    .from('employments')
    .select('*')
    .eq('employee_id', employeeId)
    .eq('company_id', companyId)
    .eq('verification_status', 'approved')
    .is('deleted_at', null)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw new Error(`Failed to check employment: ${error.message}`);
  }

  return data;
};

/**
 * Check if employee already reviewed this company
 * @param {string} employeeId - Employee UUID
 * @param {string} companyId - Company UUID
 * @returns {boolean} True if review exists
 */
const checkDuplicateReview = async (employeeId, companyId) => {
  const { data, error } = await supabase
    .from('company_reviews')
    .select('id')
    .eq('employee_id', employeeId)
    .eq('company_id', companyId)
    .is('deleted_at', null)
    .single();

  if (error && error.code !== 'PGRST116') {
    throw new Error(`Failed to check duplicate review: ${error.message}`);
  }

  return !!data;
};

/**
 * Create a new review
 * @param {Object} data - Review data
 * @param {string} employeeId - Employee UUID
 * @returns {Object} Created review
 */
const createReview = async (data, employeeId) => {
  const { companyId, overallRating, content, isAnonymous } = data;

  // Check verified employment
  const employment = await checkVerifiedEmployment(employeeId, companyId);
  if (!employment) {
    throw new Error('You must have verified employment at this company to leave a review');
  }

  // Check for duplicate review
  const isDuplicate = await checkDuplicateReview(employeeId, companyId);
  if (isDuplicate) {
    throw new Error('You have already reviewed this company');
  }

  // Calculate can_edit_until (48 hours from now)
  const canEditUntil = new Date();
  canEditUntil.setHours(canEditUntil.getHours() + 48);

  const reviewData = {
    company_id: companyId,
    employee_id: employeeId,
    employment_id: employment.id,
    overall_rating: overallRating,
    content: content,
    is_anonymous: isAnonymous || false,
    is_published: true,
    can_edit_until: canEditUntil.toISOString()
  };

  const { data: newReview, error } = await supabase
    .from('company_reviews')
    .insert(reviewData)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create review: ${error.message}`);
  }

  // Recalculate company rating
  await recalculateCompanyRating(companyId);

  return newReview;
};

/**
 * Update a review (within 48 hour window)
 * @param {string} reviewId - Review UUID
 * @param {Object} data - Update data
 * @param {string} employeeId - Employee UUID
 * @returns {Object} Updated review or null
 */
const updateReview = async (reviewId, data, employeeId) => {
  // Get existing review
  const { data: existingReview, error: fetchError } = await supabase
    .from('company_reviews')
    .select('*')
    .eq('id', reviewId)
    .eq('employee_id', employeeId)
    .is('deleted_at', null)
    .single();

  if (fetchError) {
    if (fetchError.code === 'PGRST116') return null;
    throw new Error(`Failed to fetch review: ${fetchError.message}`);
  }

  // Check edit window
  const canEditUntil = new Date(existingReview.can_edit_until);
  if (new Date() > canEditUntil) {
    throw new Error('Edit window has expired (48 hours from creation)');
  }

  const updateData = {
    overall_rating: data.overallRating || existingReview.overall_rating,
    content: data.content || existingReview.content,
    edited_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  const { data: updatedReview, error } = await supabase
    .from('company_reviews')
    .update(updateData)
    .eq('id', reviewId)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update review: ${error.message}`);
  }

  // Recalculate company rating
  await recalculateCompanyRating(existingReview.company_id);

  return updatedReview;
};

/**
 * Soft delete a review
 * @param {string} reviewId - Review UUID
 * @param {string} employeeId - Employee UUID
 * @returns {boolean} Success
 */
const deleteReview = async (reviewId, employeeId) => {
  const { data: review, error: fetchError } = await supabase
    .from('company_reviews')
    .select('company_id')
    .eq('id', reviewId)
    .eq('employee_id', employeeId)
    .is('deleted_at', null)
    .single();

  if (fetchError) {
    if (fetchError.code === 'PGRST116') return false;
    throw new Error(`Failed to fetch review: ${fetchError.message}`);
  }

  const { error } = await supabase
    .from('company_reviews')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', reviewId);

  if (error) {
    throw new Error(`Failed to delete review: ${error.message}`);
  }

  // Recalculate company rating
  await recalculateCompanyRating(review.company_id);

  return true;
};

/**
 * Get reviews for a company
 * @param {string} companyId - Company UUID
 * @param {Object} options - Pagination options
 * @returns {Object} { reviews, total, page, totalPages }
 */
const getCompanyReviews = async (companyId, options = {}) => {
  const { page = 1, limit = 10, sortBy = 'created_at', sortOrder = 'desc' } = options;
  const offset = (page - 1) * limit;

  let query = supabase
    .from('company_reviews')
    .select(`
      *,
      employees:employee_id (
        id,
        full_name,
        current_position
      )
    `, { count: 'exact' })
    .eq('company_id', companyId)
    .eq('is_published', true)
    .is('deleted_at', null);

  // Sorting
  const validSortFields = ['created_at', 'overall_rating'];
  const sortField = validSortFields.includes(sortBy) ? sortBy : 'created_at';
  query = query.order(sortField, { ascending: sortOrder === 'asc' });

  // Pagination
  query = query.range(offset, offset + limit - 1);

  const { data, error, count } = await query;

  if (error) {
    throw new Error(`Failed to fetch reviews: ${error.message}`);
  }

  // Handle anonymous reviews - hide employee info
  const reviews = data.map(review => {
    if (review.is_anonymous) {
      return {
        ...review,
        employees: null,
        employee_id: null
      };
    }
    return review;
  });

  return {
    reviews,
    total: count,
    page: parseInt(page),
    totalPages: Math.ceil(count / limit)
  };
};

/**
 * Get employee's own reviews
 * @param {string} employeeId - Employee UUID
 * @returns {Array} List of reviews
 */
const getMyReviews = async (employeeId) => {
  const { data, error } = await supabase
    .from('company_reviews')
    .select(`
      *,
      companies:company_id (
        id,
        name,
        industry,
        logo_url
      )
    `)
    .eq('employee_id', employeeId)
    .is('deleted_at', null)
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch reviews: ${error.message}`);
  }

  return data;
};

/**
 * Get a single review by ID
 * @param {string} reviewId - Review UUID
 * @returns {Object} Review data or null
 */
const getReviewById = async (reviewId) => {
  const { data, error } = await supabase
    .from('company_reviews')
    .select(`
      *,
      companies:company_id (
        id,
        name,
        industry
      ),
      employees:employee_id (
        id,
        full_name,
        current_position
      )
    `)
    .eq('id', reviewId)
    .is('deleted_at', null)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw new Error(`Failed to fetch review: ${error.message}`);
  }

  // Handle anonymous
  if (data.is_anonymous) {
    data.employees = null;
    data.employee_id = null;
  }

  return data;
};

/**
 * Recalculate company's overall rating
 * @param {string} companyId - Company UUID
 */
const recalculateCompanyRating = async (companyId) => {
  const { data: reviews, error: fetchError } = await supabase
    .from('company_reviews')
    .select('overall_rating')
    .eq('company_id', companyId)
    .eq('is_published', true)
    .is('deleted_at', null);

  if (fetchError) {
    console.error('Failed to recalculate rating:', fetchError.message);
    return;
  }

  const totalReviews = reviews.length;
  const averageRating = totalReviews > 0
    ? reviews.reduce((sum, r) => sum + r.overall_rating, 0) / totalReviews
    : 0;

  const { error: updateError } = await supabase
    .from('companies')
    .update({
      overall_rating: Math.round(averageRating * 10) / 10,
      total_reviews: totalReviews,
      updated_at: new Date().toISOString()
    })
    .eq('id', companyId);

  if (updateError) {
    console.error('Failed to update company rating:', updateError.message);
  }
};

/**
 * Report a review
 * @param {string} reviewId - Review UUID
 * @param {string} reporterId - Reporter's user UUID
 * @param {string} reason - Report reason
 * @returns {Object} Report record
 */
const reportReview = async (reviewId, reporterId, reason) => {
  const reportData = {
    review_id: reviewId,
    reporter_id: reporterId,
    reason: reason,
    status: 'pending'
  };

  const { data, error } = await supabase
    .from('reports')
    .insert(reportData)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to submit report: ${error.message}`);
  }

  return data;
};

module.exports = {
  createReview,
  updateReview,
  deleteReview,
  getCompanyReviews,
  getMyReviews,
  getReviewById,
  checkVerifiedEmployment,
  checkDuplicateReview,
  recalculateCompanyRating,
  reportReview
};
