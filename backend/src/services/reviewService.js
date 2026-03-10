// Review Service - Business logic for reviews
const supabase = require('../config/database');
const { AppError } = require('../middlewares/errorHandler');
const checkVerifiedEmployment = require('../helpers/checkVerifiedEmployment');
const { saveCategoryRatings, updateCategoryRatings, recalcCompanyCategoryAverages } = require('./categoryRatingService');
const { analyzeText, shouldAutoReport, shouldFlagForSuspension } = require('./sentimentService');
const { autoReportReview } = require('./reportService');

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
        overall_rating: 0,
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
    companyId,
    overallRating = reviewData.rating,
    content       = reviewData.reviewText,
    isAnonymous,
    departureReason,
    categoryRatings,
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
  const hasEmployment = await checkVerifiedEmployment(employeeId, companyId);
  if (!hasEmployment) {
    throw new AppError('You must have verified employment to review this company', 403);
  }

  // Check duplicate review
  const isDuplicate = await checkDuplicateReview(employeeId, companyId);
  if (isDuplicate) {
    throw new AppError('You have already reviewed this company', 409);
  }

  // Get employment ID (most recent approved, excluding soft-deleted)
  const { data: employment } = await supabase
    .from('employments')
    .select('id')
    .eq('employee_id', employeeId)
    .eq('company_id', companyId)
    .eq('verification_status', 'approved')
    .is('deleted_at', null)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!employment) {
    throw new AppError('No verified employment record found for this company', 400);
  }

  // ── SENTIMENT PRE-CHECK — hold very negative reviews for admin moderation ──
  const sentiment = analyzeText(content || '');
  if (shouldFlagForSuspension(sentiment.label)) {
    // Very negative review: save but don't publish — admin must approve
    const canEditUntil = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    const { data: flaggedReview, error: flagErr } = await supabase
      .from('company_reviews')
      .insert({
        employee_id: employeeId,
        company_id: companyId,
        employment_id: employment.id,
        overall_rating: overallRating,
        content,
        is_anonymous: isAnonymous || false,
        can_edit_until: canEditUntil,
        departure_reason: departureReason || null,
        sentiment: sentiment.label,
        sentiment_score: sentiment.comparative,
        auto_flagged: true,
        is_published: false, // held for admin moderation
      })
      .select()
      .single();

    if (flagErr) {
      console.error('❌ Error saving flagged review:', flagErr);
      throw new AppError('Failed to submit review', 500);
    }

    // Save category ratings if provided
    if (flaggedReview && categoryRatings && Object.keys(categoryRatings).length > 0) {
      await saveCategoryRatings(flaggedReview.id, categoryRatings);
    }

    // Auto-report for admin visibility
    if (flaggedReview) {
      try { await autoReportReview(flaggedReview.id, sentiment); } catch (_) {}
    }

    // Flag the user for admin review
    await supabase
      .from('users')
      .update({ pending_suspension: true })
      .eq('id', userId);

    console.warn(`⚠️  Review ${flaggedReview?.id} held for moderation — very negative (${sentiment.comparative.toFixed(3)})`);

    // Return special response so frontend can show "under review" message
    return { ...flaggedReview, _held_for_moderation: true };
  }
  // ─────────────────────────────────────────────────────────────────────────

  // Create review
  const canEditUntil = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
  const { data, error } = await supabase
    .from('company_reviews')
    .insert({
      employee_id: employeeId,
      company_id: companyId,
      employment_id: employment.id,
      overall_rating: overallRating,
      content,
      is_anonymous: isAnonymous || false,
      can_edit_until: canEditUntil,
      departure_reason: departureReason || null,
    })
    .select()
    .single();

  if (error) {
    console.error('❌ Supabase error in createReview:', error);
    throw new AppError('Failed to create review', 500);
  }

  // Save category ratings if provided
  if (categoryRatings && Object.keys(categoryRatings).length > 0) {
    await saveCategoryRatings(data.id, categoryRatings);
    await recalcCompanyCategoryAverages(companyId);
  }

  // Recalculate company rating
  await recalculateCompanyRating(companyId);

  // ── SENTIMENT TAGGING (post-save, non-blocking) ──────────────────────────
  // Tag the saved review with sentiment data. Auto-report negative ones.
  try {
    const isAutoFlagged = shouldAutoReport(sentiment.label);

    await supabase
      .from('company_reviews')
      .update({
        sentiment:       sentiment.label,
        sentiment_score: sentiment.comparative,
        auto_flagged:    isAutoFlagged,
      })
      .eq('id', data.id);

    if (isAutoFlagged) {
      await autoReportReview(data.id, sentiment);
    }
  } catch (sentimentErr) {
    console.error('Sentiment tagging failed (non-fatal):', sentimentErr.message);
  }
  // ─────────────────────────────────────────────────────────────────────────

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

  // Check 24-hour window
  const canEditUntil = new Date(review.can_edit_until);
  const now = new Date();

  if (now > canEditUntil) {
    throw new AppError('Reviews can only be edited within 24 hours of submission', 403);
  }

  // Check that the employee still has an active employment at the company they reviewed
  const { data: activeEmployment } = await supabase
    .from('employments')
    .select('id')
    .eq('employee_id', employee.id)
    .eq('company_id', review.company_id)
    .eq('verification_status', 'approved')
    .eq('is_current', true)
    .is('deleted_at', null)
    .maybeSingle();

  if (!activeEmployment) {
    throw new AppError('You cannot edit a review after ending your employment at this company', 403);
  }

  const { overallRating, content, categoryRatings } = updates;

  // Update review
  const { data, error } = await supabase
    .from('company_reviews')
    .update({
      overall_rating: overallRating,
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

  // Update category ratings if provided
  if (categoryRatings && Object.keys(categoryRatings).length > 0) {
    await updateCategoryRatings(reviewId, categoryRatings);
    await recalcCompanyCategoryAverages(review.company_id);
  }

  // Recalculate company rating if overall_rating changed
  if (overallRating && overallRating !== review.overall_rating) {
    await recalculateCompanyRating(review.company_id);
  }

  // Feature 13: Re-run sentiment analysis on edited content
  try {
    const sentiment = analyzeText(content || '');
    const isAutoFlagged = shouldAutoReport(sentiment.label);
    await supabase
      .from('company_reviews')
      .update({
        sentiment:       sentiment.label,
        sentiment_score: sentiment.comparative,
        auto_flagged:    isAutoFlagged,
      })
      .eq('id', reviewId);

    if (isAutoFlagged) {
      await autoReportReview(reviewId, sentiment);
    }
  } catch (sentimentErr) {
    console.error('Sentiment re-analysis on edit failed (non-fatal):', sentimentErr.message);
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

  // Only system_admin can delete reviews
  if (userRole !== 'system_admin') {
    throw new AppError('Only system administrators can delete reviews', 403);
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
    sortBy = 'created_at',
    sortOrder = 'desc'
  } = filters;

  // Day 6: Clamp pagination inputs
  const limit = Math.max(1, parseInt(filters.limit) || 10);
  const page = Math.max(1, parseInt(filters.page) || 1);

  const validSortBy = ['created_at', 'overall_rating'];
  const sortField = validSortBy.includes(sortBy) ? sortBy : 'created_at';

  // Step 1: Get total count first
  const { count, error: countError } = await supabase
    .from('public_company_reviews')
    .select('*', { count: 'exact', head: true })
    .eq('company_id', companyId);

  if (countError) {
    console.error('❌ Supabase error in getCompanyReviews (count):', countError);
    throw new AppError('Failed to fetch reviews', 500);
  }

  const totalPages = count > 0 ? Math.ceil(count / limit) : 1;

  // Day 6: Handle page > totalPages gracefully
  if (page > totalPages) {
    return {
      reviews: [],
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
  const offset = (page - 1) * limit;
  const { data, error } = await supabase
    .from('public_company_reviews')
    .select('*')
    .eq('company_id', companyId)
    .order(sortField, { ascending: sortOrder === 'asc' })
    .range(offset, offset + limit - 1);

  if (error) {
    console.error('❌ Supabase error in getCompanyReviews:', error);
    throw new AppError('Failed to fetch reviews', 500);
  }

  // Enrich reviews: attach reply and live helpful_count for each review
  const reviewIds = (data || []).map(r => r.id);
  let replyMap = {};
  let voteCountMap = {};

  if (reviewIds.length > 0) {
    const [repliesRes, votesRes] = await Promise.all([
      supabase.from('review_replies').select('*').in('review_id', reviewIds),
      supabase.from('review_votes').select('review_id').in('review_id', reviewIds),
    ]);

    (repliesRes.data || []).forEach(reply => {
      replyMap[reply.review_id] = {
        id:        reply.id,
        content:   reply.content,
        createdAt: reply.created_at,
        updatedAt: reply.updated_at,
      };
    });

    (votesRes.data || []).forEach(vote => {
      voteCountMap[vote.review_id] = (voteCountMap[vote.review_id] || 0) + 1;
    });
  }

  const enrichedReviews = (data || []).map(review => ({
    ...review,
    reply:         replyMap[review.id] ?? null,
    helpful_count: voteCountMap[review.id] ?? review.helpful_count ?? 0,
  }));

  return {
    reviews: enrichedReviews,
    pagination: {
      total: count,
      page,
      limit,
      totalPages
    }
  };
};

/**
 * Get current user's reviews (Days 3-4)
 */
const getMyReviews = async (userId, filters = {}) => {
  // Day 6: Clamp pagination inputs
  const limit = Math.max(1, parseInt(filters.limit) || 10);
  const page = Math.max(1, parseInt(filters.page) || 1);

  // Get employee ID
  const { data: employee } = await supabase
    .from('employees')
    .select('id')
    .eq('user_id', userId)
    .single();

  if (!employee) {
    throw new AppError('Employee profile not found', 404);
  }

  // Step 1: Get total count first
  const { count, error: countError } = await supabase
    .from('company_reviews')
    .select('*', { count: 'exact', head: true })
    .eq('employee_id', employee.id)
    .is('deleted_at', null);

  if (countError) {
    console.error('❌ Supabase error in getMyReviews (count):', countError);
    throw new AppError('Failed to fetch your reviews', 500);
  }

  const totalPages = count > 0 ? Math.ceil(count / limit) : 1;

  // Day 6: Handle page > totalPages gracefully
  if (page > totalPages) {
    return {
      reviews: [],
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
  const offset = (page - 1) * limit;
  const { data, error } = await supabase
    .from('company_reviews')
    .select(`
      *,
      companies:company_id (
        id,
        name,
        logo_url
      )
    `)
    .eq('employee_id', employee.id)
    .is('deleted_at', null)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    console.error('❌ Supabase error in getMyReviews:', error);
    throw new AppError('Failed to fetch your reviews', 500);
  }

  return {
    reviews: data,
    pagination: {
      total: count,
      page,
      limit,
      totalPages
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

  // Strip identity info for anonymous reviews (BUG-012)
  if (data.is_anonymous) {
    delete data.employee_id;
    delete data.employment_id;
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
  checkDuplicateReview,
  recalculateCompanyRating,
};
