//this file to make sure that reviewer and rated employee have approved employment in the same company
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

// GET feedback received — employee sees only feedback about themselves; admin sees all
async function getFeedbackReceived({ employeeId, isSystemAdmin, page = 1, limit = 20 }) {
  const offset = (page - 1) * limit;

  let query = supabase
    .from("employee_feedback")
    .select(
      `id, professionalism, communication, teamwork, reliability,
       written_feedback, quarter, year, created_at,
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

  return {
    data,
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

module.exports = {
  getEmployeeIdByUserId,
  bothApprovedInCompany,
  feedbackAlreadyExists,
  createFeedback,
  getFeedbackReceived,
  getFeedbackGiven
};