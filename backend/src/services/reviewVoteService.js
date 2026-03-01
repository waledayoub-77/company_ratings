// Review Vote Service — helpful/unhelpful votes
const supabase = require('../config/database');
const { AppError } = require('../middlewares/errorHandler');

/**
 * Toggle a helpful vote on a review
 */
const toggleVote = async (reviewId, userId, voteType = 'helpful') => {
  if (!['helpful', 'unhelpful'].includes(voteType)) {
    throw new AppError('Invalid vote type', 400);
  }

  // Check existing vote
  const { data: existing } = await supabase
    .from('review_votes')
    .select('id, vote_type')
    .eq('review_id', reviewId)
    .eq('user_id', userId)
    .maybeSingle();

  if (existing) {
    if (existing.vote_type === voteType) {
      // Same vote — remove it (toggle off)
      await supabase.from('review_votes').delete().eq('id', existing.id);
      await recalcHelpfulCount(reviewId);
      return { action: 'removed', voteType: null };
    } else {
      // Different vote — update
      await supabase
        .from('review_votes')
        .update({ vote_type: voteType })
        .eq('id', existing.id);
      await recalcHelpfulCount(reviewId);
      return { action: 'changed', voteType };
    }
  }

  // New vote
  const { error } = await supabase
    .from('review_votes')
    .insert({ review_id: reviewId, user_id: userId, vote_type: voteType });

  if (error) {
    console.error('❌ Supabase error in toggleVote:', error);
    throw new AppError('Failed to save vote', 500);
  }

  await recalcHelpfulCount(reviewId);
  return { action: 'added', voteType };
};

/**
 * Recalculate helpful_count on the review
 */
const recalcHelpfulCount = async (reviewId) => {
  const { count } = await supabase
    .from('review_votes')
    .select('id', { count: 'exact', head: true })
    .eq('review_id', reviewId)
    .eq('vote_type', 'helpful');

  await supabase
    .from('company_reviews')
    .update({ helpful_count: count || 0 })
    .eq('id', reviewId);
};

/**
 * Get user's votes for multiple reviews (batch)
 */
const getUserVotesForReviews = async (userId, reviewIds) => {
  if (!userId || !reviewIds || reviewIds.length === 0) return {};

  const { data } = await supabase
    .from('review_votes')
    .select('review_id, vote_type')
    .eq('user_id', userId)
    .in('review_id', reviewIds);

  const map = {};
  (data || []).forEach(v => { map[v.review_id] = v.vote_type; });
  return map;
};

/**
 * Get vote counts for multiple reviews
 */
const getVoteCountsForReviews = async (reviewIds) => {
  if (!reviewIds || reviewIds.length === 0) return {};

  const { data } = await supabase
    .from('review_votes')
    .select('review_id, vote_type')
    .in('review_id', reviewIds);

  const counts = {};
  (data || []).forEach(v => {
    if (!counts[v.review_id]) counts[v.review_id] = { helpful: 0, unhelpful: 0 };
    counts[v.review_id][v.vote_type]++;
  });
  return counts;
};

module.exports = {
  toggleVote,
  getUserVotesForReviews,
  getVoteCountsForReviews,
};
