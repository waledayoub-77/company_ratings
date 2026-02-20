const supabase = require("../config/database");

// helper: get employee id for the logged-in user
async function getEmployeeIdByUserId(userId) {
  const { data, error } = await supabase
    .from("employees")
    .select("id")
    .eq("user_id", userId)
    .single();

  if (error || !data) return { error: "Employee profile not linked to user" };
  return { data: data.id };
}

// helper: check BOTH reviewer + target have approved employment in same company
async function bothApprovedInCompany({ reviewerEmployeeId, ratedEmployeeId, companyId }) {
  const { data, error } = await supabase
    .from("employments")
    .select("employee_id")
    .in("employee_id", [reviewerEmployeeId, ratedEmployeeId])
    .eq("company_id", companyId)
    .eq("verification_status", "approved")
    .is("deleted_at", null);

  if (error) return { error: error.message };

  const ids = new Set((data || []).map((r) => r.employee_id));
  const ok = ids.has(reviewerEmployeeId) && ids.has(ratedEmployeeId);

  if (!ok) return { error: "Both employees must have approved employment in the same company" };
  return { data: true };
}

// helper: one per quarter
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
  year
}) {
  const payload = {
    reviewer_id: reviewerEmployeeId,
    rated_employee_id: ratedEmployeeId,
    company_id: companyId,
    professionalism,
    communication,
    teamwork,
    reliability,
    written_feedback: writtenFeedback || null,
    quarter,
    year
  };

  const { data, error } = await supabase
    .from("employee_feedback")
    .insert(payload)
    .select("*")
    .single();

  if (error) return { error: error.message };
  return { data };
}

module.exports = {
  getEmployeeIdByUserId,
  bothApprovedInCompany,
  feedbackAlreadyExists,
  createFeedback
};