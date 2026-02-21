const supabase = require("../config/database");

exports.createFeedback = async (req, res) => {
  try {
    const userId = req.user.userId;

    const {
      ratedEmployeeId,
      companyId,
      professionalism,
      communication,
      teamwork,
      reliability,
      writtenFeedback,
      quarter,
      year
    } = req.body;

    // 1) reviewer employee id
    const reviewerRes = await feedbackService.getEmployeeIdByUserId(userId);
    if (reviewerRes.error) return res.status(404).json({ message: reviewerRes.error });
    const reviewerEmployeeId = reviewerRes.data;

    // 2) no self feedback
    if (reviewerEmployeeId === ratedEmployeeId) {
      return res.status(400).json({ message: "You cannot give feedback to yourself" });
    }

    // 3) both approved same company
    const sameCompanyRes = await feedbackService.bothApprovedInCompany({
      reviewerEmployeeId,
      ratedEmployeeId,
      companyId
    });
    if (sameCompanyRes.error) return res.status(400).json({ message: sameCompanyRes.error });

    // 4) one per quarter/year
    const existsRes = await feedbackService.feedbackAlreadyExists({
      reviewerEmployeeId,
      ratedEmployeeId,
      companyId,
      quarter,
      year
    });
    if (existsRes.error) return res.status(400).json({ message: existsRes.error });

    if (existsRes.data === true) {
      return res.status(400).json({
        message: "Feedback already submitted for this employee in this quarter"
      });
    }

    // 5) create
    const createRes = await feedbackService.createFeedback({
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
    });

    if (createRes.error) return res.status(400).json({ message: createRes.error });

    return res.status(201).json({ data: createRes.data });
  } catch (err) {
    console.error("createFeedback error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

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