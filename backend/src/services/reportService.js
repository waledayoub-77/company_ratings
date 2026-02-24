const supabase = require('../config/database');
const { AppError } = require('../middlewares/errorHandler');
const { logAdminAction } = require('../utils/auditLogger');

const ALLOWED_REPORT_REASONS = ['false_info', 'spam', 'harassment', 'other'];
const ALLOWED_RESOLVE_ACTIONS = ['remove', 'dismiss'];

const recalculateCompanyRating = async (companyId) => {
  const { data: reviews, error: reviewsError } = await supabase
    .from('company_reviews')
    .select('overall_rating')
    .eq('company_id', companyId)
    .is('deleted_at', null);

  if (reviewsError) throw reviewsError;

  const totalReviews = reviews.length;
  const averageRating = totalReviews > 0
    ? Number((reviews.reduce((sum, review) => sum + review.overall_rating, 0) / totalReviews).toFixed(1))
    : 0;

  const { error: updateError } = await supabase
    .from('companies')
    .update({
      overall_rating: averageRating,
      total_reviews: totalReviews,
    })
    .eq('id', companyId);

  if (updateError) throw updateError;
};

const createReport = async ({ reviewId, reporterId, reason, description }) => {
  if (!ALLOWED_REPORT_REASONS.includes(reason)) {
    throw new AppError('Invalid report reason', 400, 'INVALID_REPORT_REASON');
  }

  if (!description || description.trim().length < 20) {
    throw new AppError('Description must be at least 20 characters', 400, 'INVALID_DESCRIPTION');
  }

  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const { count, error: quotaError } = await supabase
    .from('reported_reviews')
    .select('*', { count: 'exact', head: true })
    .eq('reporter_id', reporterId)
    .gte('created_at', since);

  if (quotaError) throw quotaError;

  if ((count || 0) >= 5) {
    throw new AppError('Report limit exceeded. Maximum 5 reports per day.', 429, 'REPORT_LIMIT_EXCEEDED');
  }

  const { data: report, error } = await supabase
    .from('reported_reviews')
    .insert({
      review_id: reviewId,
      reporter_id: reporterId,
      reason,
      description: description.trim(),
      status: 'pending',
    })
    .select()
    .single();

  if (error) throw error;
  return report;
};

const getReports = async ({ status, page = 1, limit = 20 }) => {
  const safePage = Math.max(Number(page) || 1, 1);
  const safeLimit = Math.min(Math.max(Number(limit) || 20, 1), 100);
  const from = (safePage - 1) * safeLimit;
  const to = from + safeLimit - 1;

  let query = supabase
    .from('reported_reviews')
    .select(
      `id, review_id, reporter_id, reason, description, status, admin_note, resolved_by, resolved_at, created_at,
      company_reviews (id, content, overall_rating, company_id),
      users!reported_reviews_reporter_id_fkey (email)`,
      { count: 'exact' }
    )
    .order('created_at', { ascending: false })
    .range(from, to);

  if (status) {
    query = query.eq('status', status);
  }

  const { data: reports, error, count } = await query;
  if (error) throw error;

  const companyIds = [...new Set((reports || [])
    .map((item) => item.company_reviews?.company_id)
    .filter(Boolean))];

  let companyMap = {};
  if (companyIds.length > 0) {
    const { data: companies, error: companiesError } = await supabase
      .from('companies')
      .select('id, name')
      .in('id', companyIds);

    if (companiesError) throw companiesError;

    companyMap = (companies || []).reduce((acc, company) => {
      acc[company.id] = company.name;
      return acc;
    }, {});
  }

  const mappedReports = (reports || []).map((item) => ({
    id: item.id,
    reviewId: item.review_id,
    reviewContent: item.company_reviews?.content || null,
    reviewRating: item.company_reviews?.overall_rating || null,
    companyName: item.company_reviews?.company_id ? (companyMap[item.company_reviews.company_id] || null) : null,
    reporterEmail: item.users?.email || null,
    reason: item.reason,
    description: item.description,
    status: item.status,
    adminNote: item.admin_note,
    resolvedBy: item.resolved_by,
    resolvedAt: item.resolved_at,
    createdAt: item.created_at,
  }));

  return {
    reports: mappedReports,
    pagination: {
      total: count || 0,
      page: safePage,
      pages: Math.ceil((count || 0) / safeLimit),
      limit: safeLimit,
    },
  };
};

const resolveReport = async ({ id, action, adminNote, adminId, ipAddress, userAgent }) => {
  if (!ALLOWED_RESOLVE_ACTIONS.includes(action)) {
    throw new AppError('Action must be remove or dismiss', 400, 'INVALID_ACTION');
  }

  const { data: report, error: reportError } = await supabase
    .from('reported_reviews')
    .select('id, review_id, status')
    .eq('id', id)
    .maybeSingle();

  if (reportError) throw reportError;
  if (!report) throw new AppError('Report not found', 404, 'REPORT_NOT_FOUND');
  if (report.status !== 'pending') throw new AppError('Report already resolved', 400, 'REPORT_ALREADY_RESOLVED');

  if (action === 'remove') {
    const { data: review, error: reviewError } = await supabase
      .from('company_reviews')
      .select('id, company_id')
      .eq('id', report.review_id)
      .maybeSingle();

    if (reviewError) throw reviewError;
    if (review) {
      const { error: deleteError } = await supabase
        .from('company_reviews')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', review.id);

      if (deleteError) throw deleteError;

      await recalculateCompanyRating(review.company_id);

      await logAdminAction({
        adminId,
        action: 'remove_review',
        entityType: 'review',
        entityId: review.id,
        details: { reason: adminNote || 'Removed via report moderation' },
        ipAddress,
        userAgent,
      });
    }
  }

  const nextStatus = action === 'remove' ? 'resolved' : 'dismissed';
  const { data: updatedReport, error: updateError } = await supabase
    .from('reported_reviews')
    .update({
      status: nextStatus,
      admin_note: adminNote || null,
      resolved_by: adminId,
      resolved_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single();

  if (updateError) throw updateError;
  return updatedReport;
};

module.exports = {
  createReport,
  getReports,
  resolveReport,
};
