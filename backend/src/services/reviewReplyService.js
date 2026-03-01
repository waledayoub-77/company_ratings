// Review Reply Service — company admin replies to reviews
const supabase = require('../config/database');
const { AppError } = require('../middlewares/errorHandler');

/**
 * Create a reply to a review (company admin only)
 */
const createReply = async (reviewId, userId, content) => {
  if (!content || content.trim().length < 10) {
    throw new AppError('Reply must be at least 10 characters', 400);
  }
  if (content.trim().length > 2000) {
    throw new AppError('Reply must not exceed 2000 characters', 400);
  }

  // Get the review to verify the company
  const { data: review, error: reviewError } = await supabase
    .from('company_reviews')
    .select('id, company_id')
    .eq('id', reviewId)
    .is('deleted_at', null)
    .single();

  if (reviewError || !review) {
    throw new AppError('Review not found', 404);
  }

  // Verify user is the company admin for this company
  const { data: company } = await supabase
    .from('companies')
    .select('id, user_id')
    .eq('id', review.company_id)
    .is('deleted_at', null)
    .single();

  if (!company || company.user_id !== userId) {
    throw new AppError('Only the company admin can reply to reviews', 403);
  }

  // Check if there's already a reply
  const { data: existing } = await supabase
    .from('review_replies')
    .select('id')
    .eq('review_id', reviewId)
    .maybeSingle();

  if (existing) {
    throw new AppError('A reply already exists for this review. You can edit it instead.', 400);
  }

  const { data, error } = await supabase
    .from('review_replies')
    .insert({
      review_id: reviewId,
      user_id: userId,
      content: content.trim(),
    })
    .select()
    .single();

  if (error) {
    console.error('❌ Supabase error in createReply:', error);
    throw new AppError('Failed to create reply', 500);
  }

  return data;
};

/**
 * Update an existing reply
 */
const updateReply = async (replyId, userId, content) => {
  if (!content || content.trim().length < 10) {
    throw new AppError('Reply must be at least 10 characters', 400);
  }

  const { data: reply } = await supabase
    .from('review_replies')
    .select('id, user_id')
    .eq('id', replyId)
    .single();

  if (!reply) throw new AppError('Reply not found', 404);
  if (reply.user_id !== userId) throw new AppError('Not authorized', 403);

  const { data, error } = await supabase
    .from('review_replies')
    .update({ content: content.trim(), updated_at: new Date().toISOString() })
    .eq('id', replyId)
    .select()
    .single();

  if (error) throw new AppError('Failed to update reply', 500);
  return data;
};

/**
 * Delete a reply
 */
const deleteReply = async (replyId, userId, isAdmin = false) => {
  const { data: reply } = await supabase
    .from('review_replies')
    .select('id, user_id')
    .eq('id', replyId)
    .single();

  if (!reply) throw new AppError('Reply not found', 404);
  if (reply.user_id !== userId && !isAdmin) throw new AppError('Not authorized', 403);

  await supabase.from('review_replies').delete().eq('id', replyId);
  return { message: 'Reply deleted' };
};

/**
 * Get replies for multiple reviews (batch)
 */
const getRepliesForReviews = async (reviewIds) => {
  if (!reviewIds || reviewIds.length === 0) return {};

  const { data, error } = await supabase
    .from('review_replies')
    .select('id, review_id, content, created_at, updated_at, users!inner(full_name, email)')
    .in('review_id', reviewIds);

  if (error) return {};

  const grouped = {};
  (data || []).forEach(reply => {
    grouped[reply.review_id] = {
      id: reply.id,
      content: reply.content,
      createdAt: reply.created_at,
      updatedAt: reply.updated_at,
      replierName: reply.users?.full_name || 'Company Admin',
    };
  });
  return grouped;
};

module.exports = {
  createReply,
  updateReply,
  deleteReply,
  getRepliesForReviews,
};
