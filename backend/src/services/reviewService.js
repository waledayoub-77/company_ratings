// Review Service - Business logic for reviews
const supabase = require('../config/database');
const { AppError } = require('../middlewares/errorHandler');
const crypto = require('crypto');
const checkVerifiedEmployment = require('../helpers/checkVerifiedEmployment');

// Valid reasons for reporting a review (must match database enum)
const VALID_REPORT_REASONS = ['false_info', 'spam', 'harassment', 'other'];

/**
 * Check if user already reviewed this company
 */
const checkDuplicateReview = async (employeeId, companyId) => {
  const { data } = await supabase
    .from('company_reviews')
    .select('id')
    .eq('employee_id', employeeId)
    .eq('company_id', companyId)
    .is('deleted_at', null)
    .single();

  return !!data;
};

/**
 * Recalculate company average rating after review changes
 */
const recalculateCompanyRating = async (companyId) => {
  const { data: reviews } = await supabase
    .from('company_reviews')
    .select('overall_rating')
    .eq('company_id', companyId)
    .is('deleted_at', null);

  if (!reviews || reviews.length === 0) {
    await supabase
      .from('companies')
      .update({
        overall_rating: null,
        total_reviews: 0
      })
      .eq('id', companyId);
    return;
  }

  const sum = reviews.reduce((acc, r) => acc + r.overall_rating, 0);
  const average = sum / reviews.length;

  await supabase
    .from('companies')
    .update({
      overall_rating: average.toFixed(1),
      total_reviews: reviews.length
    })
    .eq('id', companyId);
};

/**
 * Create a new review (Days 0-2)
 * With employment verification and duplicate prevention
 */
const createReview = async (reviewData, userId) => {
  const {
    company_id,
    overall_rating,
    content,
    is_anonymous
  } = reviewData;

  // First get employee ID from user ID
  const { data: employee, error: empError } = await supabase
    .from('employees')
    .select('id')
    .eq('user_id', userId)
    .single();

  if (empError || !employee) {
    throw new AppError('Employee profile not found', 404);
  }

  const employeeId = employee.id;

  // Check verified employment
  const hasEmployment = await checkVerifiedEmployment(employeeId, company_id);
  if (!hasEmployment) {
    throw new AppError('You must have verified employment to review this company', 403);
  }

  // Check duplicate review
  const isDuplicate = await checkDuplicateReview(employeeId, company_id);
  if (isDuplicate) {
    throw new AppError('You have already reviewed this company', 400);
  }

  // Get employment ID
  const { data: employment } = await supabase
    .from('employments')
    .select('id')
    .eq('employee_id', employeeId)
    .eq('company_id', company_id)
    .eq('verification_status', 'approved')
    .single();

  // Create review
  const { data, error } = await supabase
    .from('company_reviews')
    .insert({
      employee_id: employeeId,
      company_id,
      employment_id: employment.id,
      overall_rating,
      content,
      is_anonymous: is_anonymous || false
    })
    .select()
    .single();

  if (error) {
    console.error('❌ Supabase error in createReview:', error);
    throw new AppError('Failed to create review', 500);
  }

  // Recalculate company rating
  await recalculateCompanyRating(company_id);

  return data;
};

/**
 * Update review (Days 3-4)
 * Can only edit within 48 hours
 */
const updateReview = async (reviewId, updates, userId) => {
  // First get employee ID
  const { data: employee } = await supabase
    .from('employees')
    .select('id')
    .eq('user_id', userId)
    .single();

  if (!employee) {
    throw new AppError('Employee profile not found', 404);
  }

  // Get review
  const { data: review, error: fetchError } = await supabase
    .from('company_reviews')
    .select('*')
    .eq('id', reviewId)
    .is('deleted_at', null)
    .single();

  if (fetchError || !review) {
    throw new AppError('Review not found', 404);
  }

  // Check ownership
  if (review.employee_id !== employee.id) {
    throw new AppError('You can only edit your own reviews', 403);
  }

  // Check 48-hour window
  const canEditUntil = new Date(review.can_edit_until);
  const now = new Date();

  if (now > canEditUntil) {
    throw new AppError('Reviews can only be edited within 48 hours of submission', 403);
  }

  const { overall_rating, content } = updates;

  // Update review
  const { data, error } = await supabase
    .from('company_reviews')
    .update({
      overall_rating,
      content,
      edited_at: new Date().toISOString()
    })
    .eq('id', reviewId)
    .select()
    .single();

  if (error) {
    console.error('❌ Supabase error in updateReview:', error);
    throw new AppError('Failed to update review', 500);
  }

  // Recalculate company rating if overall_rating changed
  if (overall_rating && overall_rating !== review.overall_rating) {
    await recalculateCompanyRating(review.company_id);
  }

  return data;
};

/**
 * Soft delete review
 */
const deleteReview = async (reviewId, userId, userRole) => {
  // Get employee ID
  const { data: employee } = await supabase
    .from('employees')
    .select('id')
    .eq('user_id', userId)
    .single();

  const { data: review, error: fetchError } = await supabase
    .from('company_reviews')
    .select('*')
    .eq('id', reviewId)
    .is('deleted_at', null)
    .single();

  if (fetchError || !review) {
    throw new AppError('Review not found', 404);
  }

  // Check permissions (owner or admin)
  if (employee && review.employee_id !== employee.id && userRole !== 'system_admin') {
    throw new AppError('You do not have permission to delete this review', 403);
  }

  const { error } = await supabase
    .from('company_reviews')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', reviewId);

  if (error) {
    console.error('❌ Supabase error in deleteReview:', error);
    throw new AppError('Failed to delete review', 500);
  }

  // Recalculate company rating
  await recalculateCompanyRating(review.company_id);

  return { message: 'Review deleted successfully' };
};

/**
 * Get reviews for a specific company (Days 3-4)
 * With pagination and sorting
 */
const getCompanyReviews = async (companyId, filters = {}) => {
  const {
    page = 1,
    limit = 10,
    sortBy = 'created_at',
    sortOrder = 'desc'
  } = filters;

  // Use the public view for anonymous-safe access
  let query = supabase
    .from('public_company_reviews')
    .select('*', { count: 'exact' })
    .eq('company_id', companyId);

  // Sorting
  const validSortBy = ['created_at', 'overall_rating'];
  const sortField = validSortBy.includes(sortBy) ? sortBy : 'created_at';
  query = query.order(sortField, { ascending: sortOrder === 'asc' });

  // Pagination
  const offset = (page - 1) * limit;
  query = query.range(offset, offset + limit - 1);

  const { data, error, count } = await query;

  if (error) {
    console.error('❌ Supabase error in getCompanyReviews:', error);
    throw new AppError('Failed to fetch reviews', 500);
  }

  return {
    reviews: data,
    pagination: {
      total: count,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(count / limit)
    }
  };
};

/**
 * Get current user's reviews (Days 3-4)
 */
const getMyReviews = async (userId, filters = {}) => {
  const {
    page = 1,
    limit = 10
  } = filters;

  // Get employee ID
  const { data: employee } = await supabase
    .from('employees')
    .select('id')
    .eq('user_id', userId)
    .single();

  if (!employee) {
    throw new AppError('Employee profile not found', 404);
  }

  let query = supabase
    .from('company_reviews')
    .select(`
      *,
      companies:company_id (
        id,
        name,
        logo_url
      )
    `, { count: 'exact' })
    .eq('employee_id', employee.id)
    .is('deleted_at', null)
    .order('created_at', { ascending: false });

  // Pagination
  const offset = (page - 1) * limit;
  query = query.range(offset, offset + limit - 1);

  const { data, error, count } = await query;

  if (error) {
    console.error('❌ Supabase error in getMyReviews:', error);
    throw new AppError('Failed to fetch your reviews', 500);
  }

  return {
    reviews: data,
    pagination: {
      total: count,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(count / limit)
    }
  };
};

/**
 * Get single review by ID
 */
const getReviewById = async (reviewId) => {
  const { data, error } = await supabase
    .from('company_reviews')
    .select('*')
    .eq('id', reviewId)
    .is('deleted_at', null)
    .single();

  if (error || !data) {
    throw new AppError('Review not found', 404);
  }

  return data;
};

/**
 * Report a review
 */
const reportReview = async (reviewId, reportData, userId) => {
  const { reason, description } = reportData;

  // Validate reason before saving to database
  if (!reason || !VALID_REPORT_REASONS.includes(reason)) {
    throw new AppError(
      `Invalid report reason. Must be one of: ${VALID_REPORT_REASONS.join(', ')}`,
      400
    );
  }

  // Verify review exists
  await getReviewById(reviewId);

  // Create report
  const { data, error } = await supabase
    .from('reported_reviews')
    .insert({
      reporter_id: userId,
      review_id: reviewId,
      reason,
      description
    })
    .select()
    .single();

  if (error) {
    console.error('❌ Supabase error in reportReview:', error);
    throw new AppError('Failed to submit report', 500);
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
  reportReview,
  checkDuplicateReview,
  recalculateCompanyRating
};
