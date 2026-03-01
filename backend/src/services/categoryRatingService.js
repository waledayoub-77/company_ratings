// Category Rating Service — handles multi-category review ratings
const supabase = require('../config/database');
const { AppError } = require('../middlewares/errorHandler');

const VALID_CATEGORIES = [
  'work_life_balance',
  'compensation',
  'management',
  'culture',
  'career_growth',
  'facilities',
];

/**
 * Save category ratings for a review
 */
const saveCategoryRatings = async (reviewId, categoryRatings) => {
  if (!categoryRatings || typeof categoryRatings !== 'object') return [];

  const rows = [];
  for (const [category, rating] of Object.entries(categoryRatings)) {
    if (!VALID_CATEGORIES.includes(category)) continue;
    const val = parseInt(rating);
    if (isNaN(val) || val < 1 || val > 10) continue;
    rows.push({ review_id: reviewId, category, score: val });
  }

  if (rows.length === 0) return [];

  const { data, error } = await supabase
    .from('category_ratings')
    .insert(rows)
    .select();

  if (error) {
    console.error('❌ Supabase error in saveCategoryRatings:', error);
    throw new AppError('Failed to save category ratings', 500);
  }

  return data;
};

/**
 * Get category ratings for a specific review
 */
const getCategoryRatings = async (reviewId) => {
  const { data, error } = await supabase
    .from('category_ratings')
    .select('category, score')
    .eq('review_id', reviewId);

  if (error) return [];
  return data || [];
};

/**
 * Get category ratings for multiple reviews (batch)
 */
const getCategoryRatingsForReviews = async (reviewIds) => {
  if (!reviewIds || reviewIds.length === 0) return {};

  const { data, error } = await supabase
    .from('category_ratings')
    .select('review_id, category, score')
    .in('review_id', reviewIds);

  if (error) return {};

  // Group by review_id
  const grouped = {};
  (data || []).forEach(r => {
    if (!grouped[r.review_id]) grouped[r.review_id] = {};
    grouped[r.review_id][r.category] = r.score;
  });
  return grouped;
};

/**
 * Recalculate company category averages
 */
const recalcCompanyCategoryAverages = async (companyId) => {
  // Get all reviews for this company
  const { data: reviews } = await supabase
    .from('company_reviews')
    .select('id')
    .eq('company_id', companyId)
    .is('deleted_at', null);

  if (!reviews || reviews.length === 0) return;

  const reviewIds = reviews.map(r => r.id);
  const { data: ratings } = await supabase
    .from('category_ratings')
    .select('category, score')
    .in('review_id', reviewIds);

  if (!ratings || ratings.length === 0) return;

  // Calculate averages per category
  const sums = {};
  const counts = {};
  ratings.forEach(r => {
    if (!sums[r.category]) { sums[r.category] = 0; counts[r.category] = 0; }
    sums[r.category] += r.score;
    counts[r.category]++;
  });

  const averages = {};
  for (const cat of VALID_CATEGORIES) {
    if (counts[cat]) averages[cat] = Math.round((sums[cat] / counts[cat]) * 10) / 10;
  }

  await supabase
    .from('companies')
    .update({ category_averages: averages })
    .eq('id', companyId);
};

/**
 * Update category ratings for an existing review (delete old + insert new)
 */
const updateCategoryRatings = async (reviewId, categoryRatings) => {
  await supabase.from('category_ratings').delete().eq('review_id', reviewId);
  return saveCategoryRatings(reviewId, categoryRatings);
};

module.exports = {
  VALID_CATEGORIES,
  saveCategoryRatings,
  getCategoryRatings,
  getCategoryRatingsForReviews,
  recalcCompanyCategoryAverages,
  updateCategoryRatings,
};
