// Review Vote Service — helpful votes (toggle on/off)
const supabase = require('../config/database');
const { AppError } = require('../middlewares/errorHandler');

/**
 * Toggle a helpful vote on a review.
 * The review_votes table has only (id, review_id, user_id, created_at).
 * A row existing = helpful vote. No vote_type column.
 */
const toggleVote = async (reviewId, userId) => {
  // Check existing vote
  const { data: existing } = await supabase
    .from('review_votes')
    .select('id')
    .eq('review_id', reviewId)
    .eq('user_id', userId)
    .maybeSingle();

  if (existing) {
    // Already voted — remove it (toggle off)
    await supabase.from('review_votes').delete().eq('id', existing.id);
    await recalcHelpfulCount(reviewId);
    return { action: 'removed' };
  }

  // New vote
  const { error } = await supabase
    .from('review_votes')
    .insert({ review_id: reviewId, user_id: userId });

  if (error) {
    console.error('❌ Supabase error in toggleVote:', error);
    throw new AppError('Failed to save vote', 500);
  }

  await recalcHelpfulCount(reviewId);
  return { action: 'added' };
};

/**
 * Recalculate helpful_count on the review
 */
const recalcHelpfulCount = async (reviewId) => {
  const { count } = await supabase
    .from('review_votes')
    .select('id', { count: 'exact', head: true })
    .eq('review_id', reviewId);

  await supabase
    .from('company_reviews')
    .update({ helpful_count: count || 0 })
    .eq('id', reviewId);
};

/**
 * Get user's votes for multiple reviews (batch).
 * Returns a set of review_ids the user has voted on.
 */
const getUserVotesForReviews = async (userId, reviewIds) => {
  if (!userId || !reviewIds || reviewIds.length === 0) return {};

  const { data } = await supabase
    .from('review_votes')
    .select('review_id')
    .eq('user_id', userId)
    .in('review_id', reviewIds);

  const map = {};
  (data || []).forEach(v => { map[v.review_id] = 'helpful'; });
  return map;
};

/**
 * Get vote counts for multiple reviews
 */
const getVoteCountsForReviews = async (reviewIds) => {
  if (!reviewIds || reviewIds.length === 0) return {};

  const { data } = await supabase
    .from('review_votes')
    .select('review_id')
    .in('review_id', reviewIds);

  const counts = {};
  (data || []).forEach(v => {
    if (!counts[v.review_id]) counts[v.review_id] = { helpful: 0 };
    counts[v.review_id].helpful++;
  });
  return counts;
};

module.exports = {
  toggleVote,
  getUserVotesForReviews,
  getVoteCountsForReviews,
};
