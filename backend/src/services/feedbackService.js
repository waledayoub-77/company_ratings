const supabase = require("../config/database");

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

// Both reviewer + rated must have APPROVED employment in SAME company
async function bothApprovedInCompany({ reviewerEmployeeId, ratedEmployeeId, companyId }) {
  const { data, error } = await supabase
    .from("employments")
    .select("employee_id")
    .eq("company_id", companyId)
    .eq("verification_status", "approved")
    .in("employee_id", [reviewerEmployeeId, ratedEmployeeId])
    .is("deleted_at", null);

  if (error) return { error: error.message };

  const set = new Set((data || []).map((r) => r.employee_id));
  if (!set.has(reviewerEmployeeId) || !set.has(ratedEmployeeId)) {
    return { error: "Both employees must have approved employment in the same company" };
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
  year
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
      year
    })
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