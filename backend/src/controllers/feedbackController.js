const feedbackService = require("../services/feedbackService");

// UUID v4 validation helper
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

exports.createFeedback = async (req, res) => {
  try {
    const reviewerUserId = req.user?.userId; // set by requireAuth

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

    // ── Required fields ────────────────────────────────────────────────────────
    const missingFields = [];
    if (!ratedEmployeeId) missingFields.push({ field: "ratedEmployeeId", message: "ratedEmployeeId is required" });
    if (!companyId) missingFields.push({ field: "companyId", message: "companyId is required" });
    if (missingFields.length > 0) {
      return res.status(400).json({
        success: false,
        error: { message: "Validation failed", code: "VALIDATION_ERROR", details: missingFields },
      });
    }

    // ── UUID format validation ─────────────────────────────────────────────────
    if (!UUID_REGEX.test(ratedEmployeeId)) {
      return res.status(400).json({
        success: false,
        error: { message: "Validation failed", code: "VALIDATION_ERROR",
          details: [{ field: "ratedEmployeeId", message: "ratedEmployeeId must be a valid UUID" }] }
      });
    }
    if (!UUID_REGEX.test(companyId)) {
      return res.status(400).json({
        success: false,
        error: { message: "Validation failed", code: "VALIDATION_ERROR",
          details: [{ field: "companyId", message: "companyId must be a valid UUID" }] }
      });
    }

    // ── Rating validation (integers 1–5) ───────────────────────────────────────
    const ratings = { professionalism, communication, teamwork, reliability };
    for (const [field, val] of Object.entries(ratings)) {
      if (!Number.isInteger(val) || val < 1 || val > 5) {
        return res.status(400).json({
          success: false,
          error: {
            message: "Validation failed",
            code: "VALIDATION_ERROR",
            details: [{ field, message: `${field} must be an integer between 1 and 5` }]
          }
        });
      }
    }

    // ── Quarter validation ─────────────────────────────────────────────────────
    if (!Number.isInteger(quarter) || quarter < 1 || quarter > 4) {
      return res.status(400).json({
        success: false,
        error: { message: "quarter must be an integer between 1 and 4", code: "VALIDATION_ERROR" }
      });
    }

    // ── Year validation ────────────────────────────────────────────────────────
    if (!Number.isInteger(year) || year < 2020 || year > 2100) {
      return res.status(400).json({
        success: false,
        error: { message: "year must be a valid integer (2020–2100)", code: "VALIDATION_ERROR" }
      });
    }

    // ── Future quarter/year guard ──────────────────────────────────────────────
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentQuarter = Math.ceil((now.getMonth() + 1) / 3);
    if (year > currentYear || (year === currentYear && quarter > currentQuarter)) {
      return res.status(400).json({
        success: false,
        error: {
          message: `Cannot submit feedback for a future period (current: Q${currentQuarter} ${currentYear})`,
          code: "FUTURE_PERIOD"
        }
      });
    }

    // ── writtenFeedback length (max 1000 chars per DB constraint) ───────────────
    if (writtenFeedback !== undefined && writtenFeedback !== null) {
      if (typeof writtenFeedback !== "string") {
        return res.status(400).json({
          success: false,
          error: { message: "writtenFeedback must be a string", code: "VALIDATION_ERROR" }
        });
      }
      if (writtenFeedback.length > 1000) {
        return res.status(400).json({
          success: false,
          error: { message: "writtenFeedback must not exceed 1000 characters", code: "VALIDATION_ERROR" }
        });
      }
    }

    // ── Get reviewer employee id ───────────────────────────────────────────────
    const reviewerRes = await feedbackService.getEmployeeIdByUserId(reviewerUserId);
    if (reviewerRes.error) {
      return res.status(404).json({ success: false, error: { message: reviewerRes.error, code: "NOT_FOUND" } });
    }
    const reviewerEmployeeId = reviewerRes.data;

    // ── No self-feedback ───────────────────────────────────────────────────────
    if (reviewerEmployeeId === ratedEmployeeId) {
      return res.status(400).json({
        success: false,
        error: { message: "You cannot give feedback to yourself", code: "SELF_FEEDBACK" },
      });
    }

    // ── Same company + current approved employment for both ────────────────────
    const sameCompanyRes = await feedbackService.bothApprovedInCompany({
      reviewerEmployeeId,
      ratedEmployeeId,
      companyId,
    });
    if (sameCompanyRes.error) {
      return res.status(403).json({ success: false, error: { message: sameCompanyRes.error, code: "FORBIDDEN" } });
    }

    // ── One per quarter ────────────────────────────────────────────────────────
    const existsRes = await feedbackService.feedbackAlreadyExists({
      reviewerEmployeeId,
      ratedEmployeeId,
      companyId,
      quarter,
      year,
    });
    if (existsRes.error) {
      return res.status(500).json({ success: false, error: { message: existsRes.error, code: "SERVER_ERROR" } });
    }
    if (existsRes.data) {
      return res.status(400).json({
        success: false,
        error: {
          message: `Feedback already submitted for Q${quarter} ${year}`,
          code: "FEEDBACK_EXISTS"
        },
      });
    }

    // ── Create feedback ────────────────────────────────────────────────────────
    const createRes = await feedbackService.createFeedback({
      reviewerEmployeeId,
      ratedEmployeeId,
      companyId,
      professionalism,
      communication,
      teamwork,
      reliability,
      writtenFeedback: writtenFeedback || null,
      quarter,
      year,
    });

    if (createRes.error) {
      return res.status(400).json({ success: false, error: { message: createRes.error, code: "BAD_REQUEST" } });
    }

    return res.status(201).json({ success: true, data: createRes.data });
  } catch (err) {
    console.error("createFeedback error:", err);
    return res.status(500).json({ success: false, error: { message: "Server error", code: "SERVER_ERROR" } });
  }
};

/**
 * GET /api/feedback/received
 * Employees see only feedback received about themselves.
 * System admins see all feedback received by any employee (optionally filter by ?employeeId=).
 */
exports.getFeedbackReceived = async (req, res) => {
  try {
    const userId = req.user?.userId;
    const role = req.user?.role;
    const isSystemAdmin = role === "system_admin";

    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));

    // filterEmployeeId: when set, query is scoped to this employee id
    let filterEmployeeId = null;

    if (isSystemAdmin) {
      // Admin: optionally filter by ?employeeId=, otherwise returns all received feedback
      if (req.query.employeeId) {
        if (!UUID_REGEX.test(req.query.employeeId)) {
          return res.status(400).json({
            success: false,
            error: { message: "employeeId must be a valid UUID", code: "VALIDATION_ERROR" }
          });
        }
        filterEmployeeId = req.query.employeeId;
      }
      // filterEmployeeId = null means: return all (admin only)
    } else {
      // Regular employee: can only see their own received feedback
      const empRes = await feedbackService.getEmployeeIdByUserId(userId);
      if (empRes.error) {
        return res.status(404).json({ success: false, error: { message: empRes.error, code: "NOT_FOUND" } });
      }
      filterEmployeeId = empRes.data;
    }

    const result = await feedbackService.getFeedbackReceived({
      employeeId: filterEmployeeId,
      isSystemAdmin,
      page,
      limit
    });
    if (result.error) {
      return res.status(500).json({ success: false, error: { message: result.error, code: "SERVER_ERROR" } });
    }

    return res.status(200).json({ success: true, data: result.data, pagination: result.pagination });
  } catch (err) {
    console.error("getFeedbackReceived error:", err);
    return res.status(500).json({ success: false, error: { message: "Server error", code: "SERVER_ERROR" } });
  }
};

/**
 * GET /api/feedback/given
 * Employees see only feedback they submitted.
 * System admins see all given feedback (optionally filter by ?employeeId=).
 */
exports.getFeedbackGiven = async (req, res) => {
  try {
    const userId = req.user?.userId;
    const role = req.user?.role;
    const isSystemAdmin = role === "system_admin";

    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));

    let filterEmployeeId = null;

    if (isSystemAdmin) {
      if (req.query.employeeId) {
        if (!UUID_REGEX.test(req.query.employeeId)) {
          return res.status(400).json({
            success: false,
            error: { message: "employeeId must be a valid UUID", code: "VALIDATION_ERROR" }
          });
        }
        filterEmployeeId = req.query.employeeId;
      }
    } else {
      const empRes = await feedbackService.getEmployeeIdByUserId(userId);
      if (empRes.error) {
        return res.status(404).json({ success: false, error: { message: empRes.error, code: "NOT_FOUND" } });
      }
      filterEmployeeId = empRes.data;
    }

    const result = await feedbackService.getFeedbackGiven({
      employeeId: filterEmployeeId,
      isSystemAdmin,
      page,
      limit
    });
    if (result.error) {
      return res.status(500).json({ success: false, error: { message: result.error, code: "SERVER_ERROR" } });
    }

    return res.status(200).json({ success: true, data: result.data, pagination: result.pagination });
  } catch (err) {
    console.error("getFeedbackGiven error:", err);
    return res.status(500).json({ success: false, error: { message: "Server error", code: "SERVER_ERROR" } });
  }
};