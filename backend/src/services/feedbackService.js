const supabase = require("../config/database");
const { analyzeText } = require('./sentimentService');

// Get employee.id from logged-in userId
async function getEmployeeIdByUserId(userId) {
  const { data, error } = await supabase
    .from("employees")
    .select("id")
    .eq("user_id", userId)
    .single();

  if (error || !data) return { error: "Employee profile not found for this user" };
  return { data: data.id };
}

// Both reviewer + rated must have APPROVED, CURRENT employment in SAME company
// Former employees (is_current = false) are restricted from giving/receiving feedback
async function bothApprovedInCompany({ reviewerEmployeeId, ratedEmployeeId, companyId }) {
  const { data, error } = await supabase
    .from("employments")
    .select("employee_id")
    .eq("company_id", companyId)
    .eq("verification_status", "approved")
    .eq("is_current", true)
    .in("employee_id", [reviewerEmployeeId, ratedEmployeeId])
    .is("deleted_at", null);

  if (error) return { error: error.message };

  const set = new Set((data || []).map((r) => r.employee_id));

  if (!set.has(reviewerEmployeeId)) {
    return { error: "You must be a current approved employee at this company to submit feedback" };
  }
  if (!set.has(ratedEmployeeId)) {
    return { error: "The rated employee must be a current approved employee at this company" };
  }
  return { data: true };
}

// Only one feedback per quarter/year (reviewer -> rated -> company)
async function feedbackAlreadyExists({ reviewerEmployeeId, ratedEmployeeId, companyId, quarter, year }) {
  const { data, error } = await supabase
    .from("employee_feedback")
    .select("id")
    .eq("reviewer_id", reviewerEmployeeId)
    .eq("rated_employee_id", ratedEmployeeId)
    .eq("company_id", companyId)
    .eq("quarter", quarter)
    .eq("year", year)
    .is("deleted_at", null)
    .limit(1);

  if (error) return { error: error.message };
  return { data: (data || []).length > 0 };
}

async function createFeedback({
  reviewerEmployeeId,
  ratedEmployeeId,
  companyId,
  professionalism,
  communication,
  teamwork,
  reliability,
  writtenFeedback,
  quarter,
  year,
  isAnonymous
}) {
  const { data, error } = await supabase
    .from("employee_feedback")
    .insert({
      reviewer_id: reviewerEmployeeId,
      rated_employee_id: ratedEmployeeId,
      company_id: companyId,
      professionalism,
      communication,
      teamwork,
      reliability,
      written_feedback: writtenFeedback || null,
      quarter,
      year,
      is_anonymous: isAnonymous === true,
    })
    .select("*")
    .single();

  if (error) return { error: error.message };

  // Feature 13: Run sentiment analysis on feedback written text
  if (writtenFeedback) {
    try {
      const sentiment = analyzeText(writtenFeedback);
      await supabase
        .from('employee_feedback')
        .update({
          ai_sentiment: sentiment.label,
          ai_toxicity_score: Math.abs(sentiment.comparative),
        })
        .eq('id', data.id);
    } catch (_) {}
  }

  return { data };
}

// GET feedback received — employee sees only feedback about themselves; admin sees all
async function getFeedbackReceived({ employeeId, isSystemAdmin, page = 1, limit = 20 }) {
  const offset = (page - 1) * limit;

  let query = supabase
    .from("employee_feedback")
    .select(
      `id, professionalism, communication, teamwork, reliability,
       written_feedback, quarter, year, created_at, is_anonymous,
       company:company_id ( id, name ),
       reviewer:reviewer_id ( id, full_name )`,
      { count: "exact" }
    )
    .is("deleted_at", null)
    .order("year", { ascending: false })
    .order("quarter", { ascending: false })
    .range(offset, offset + limit - 1);

  // Filter by employee unless admin viewing all
  if (!isSystemAdmin || employeeId) {
    query = query.eq("rated_employee_id", employeeId);
  }

  const { data, error, count } = await query;
  if (error) return { error: error.message };

  // Feature 11: Mask reviewer identity when anonymous (unless system admin)
  const maskedData = (data || []).map(fb => {
    if (fb.is_anonymous && !isSystemAdmin) {
      return { ...fb, reviewer: { id: null, full_name: 'Anonymous Colleague' } };
    }
    return fb;
  });

  return {
    data: maskedData,
    pagination: { page, limit, total: count || 0, pages: Math.ceil((count || 0) / limit) }
  };
}

// GET feedback given — employee sees feedback they submitted; admin sees all
async function getFeedbackGiven({ employeeId, isSystemAdmin, page = 1, limit = 20 }) {
  const offset = (page - 1) * limit;

  let query = supabase
    .from("employee_feedback")
    .select(
      `id, professionalism, communication, teamwork, reliability,
       written_feedback, quarter, year, created_at,
       company:company_id ( id, name ),
       rated:rated_employee_id ( id, full_name )`,
      { count: "exact" }
    )
    .is("deleted_at", null)
    .order("year", { ascending: false })
    .order("quarter", { ascending: false })
    .range(offset, offset + limit - 1);

  if (!isSystemAdmin || employeeId) {
    query = query.eq("reviewer_id", employeeId);
  }

  const { data, error, count } = await query;
  if (error) return { error: error.message };

  return {
    data,
    pagination: { page, limit, total: count || 0, pages: Math.ceil((count || 0) / limit) }
  };
}

/**
 * Returns all coworkers who share an approved, current employment with the reviewer
 * at one or more of the same companies, excluding the reviewer themselves.
 * Also flags coworkers already rated in the given quarter/year.
 */
async function getCoworkers({ userId, quarter, year }) {
  // 1. Resolve reviewer's employee id
  const { data: empRow, error: empErr } = await supabase
    .from('employees')
    .select('id')
    .eq('user_id', userId)
    .is('deleted_at', null)
    .single();

  if (empErr || !empRow) return { error: 'Employee profile not found for this user' };
  const reviewerEmployeeId = empRow.id;

  // 2. Get the reviewer's approved, current company ids
  const { data: myEmps, error: myEmpsErr } = await supabase
    .from('employments')
    .select('company_id')
    .eq('employee_id', reviewerEmployeeId)
    .eq('verification_status', 'approved')
    .eq('is_current', true)
    .is('deleted_at', null);

  if (myEmpsErr) return { error: myEmpsErr.message };
  if (!myEmps || myEmps.length === 0) return { data: [] };

  const companyIds = myEmps.map((e) => e.company_id);

  // 3. Get all OTHER approved, current employees in the same companies
  const { data: coworkerEmps, error: coworkerErr } = await supabase
    .from('employments')
    .select(
      `company_id, position, department,
       employee_id,
       employee:employee_id ( id, full_name ),
       company:company_id ( id, name )`
    )
    .in('company_id', companyIds)
    .eq('verification_status', 'approved')
    .eq('is_current', true)
    .is('deleted_at', null)
    .neq('employee_id', reviewerEmployeeId);

  if (coworkerErr) return { error: coworkerErr.message };
  if (!coworkerEmps || coworkerEmps.length === 0) return { data: [] };

  // 4. Determine which quarter/year to check
  const now = new Date();
  const q = (Number.isInteger(quarter) && quarter >= 1 && quarter <= 4)
    ? quarter
    : Math.ceil((now.getMonth() + 1) / 3);
  const y = (Number.isInteger(year) && year >= 2020)
    ? year
    : now.getFullYear();

  // 5. Find already-rated pairs for this quarter/year
  const ratedEmployeeIds = coworkerEmps.map((e) => e.employee_id);
  const { data: existing } = await supabase
    .from('employee_feedback')
    .select('rated_employee_id, company_id')
    .eq('reviewer_id', reviewerEmployeeId)
    .in('rated_employee_id', ratedEmployeeIds)
    .eq('quarter', q)
    .eq('year', y)
    .is('deleted_at', null);

  const alreadyRatedSet = new Set(
    (existing || []).map((r) => `${r.rated_employee_id}:${r.company_id}`)
  );

  const data = coworkerEmps.map((e) => ({
    employeeId:  e.employee_id,
    fullName:    e.employee?.full_name ?? 'Unknown',
    position:    e.position,
    department:  e.department ?? null,
    companyId:   e.company_id,
    companyName: e.company?.name ?? '',
    alreadyRated: alreadyRatedSet.has(`${e.employee_id}:${e.company_id}`),
    quarter: q,
    year: y,
  }));

  return { data };
}

module.exports = {
  getEmployeeIdByUserId,
  bothApprovedInCompany,
  feedbackAlreadyExists,
  createFeedback,
  getFeedbackReceived,
  getFeedbackGiven,
  getCoworkers,
};