const feedbackService = require("../services/feedbackService");

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

    // Basic validation
    if (!ratedEmployeeId || !companyId) {
      return res.status(400).json({
        success: false,
        error: {
          message: "Validation failed",
          code: "VALIDATION_ERROR",
          details: [
            !ratedEmployeeId ? { field: "ratedEmployeeId", message: "ratedEmployeeId is required" } : null,
            !companyId ? { field: "companyId", message: "companyId is required" } : null,
          ].filter(Boolean),
        },
      });
    }

    // Validate ratings (must be integers 1–5)
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

    // Validate quarter and year
    if (!Number.isInteger(quarter) || quarter < 1 || quarter > 4) {
      return res.status(400).json({
        success: false,
        error: { message: "quarter must be an integer between 1 and 4", code: "VALIDATION_ERROR" }
      });
    }
    if (!Number.isInteger(year) || year < 2020 || year > 2100) {
      return res.status(400).json({
        success: false,
        error: { message: "year must be a valid integer (2020–2100)", code: "VALIDATION_ERROR" }
      });
    }

    // Get reviewer employee id
    const reviewerRes = await feedbackService.getEmployeeIdByUserId(reviewerUserId);
    if (reviewerRes.error) {
      return res.status(404).json({ success: false, error: { message: reviewerRes.error, code: "NOT_FOUND" } });
    }
    const reviewerEmployeeId = reviewerRes.data;

    // No self-feedback
    if (reviewerEmployeeId === ratedEmployeeId) {
      return res.status(400).json({
        success: false,
        error: { message: "You cannot give feedback to yourself", code: "SELF_FEEDBACK" },
      });
    }

    // Same company + approved employment for both
    const sameCompanyRes = await feedbackService.bothApprovedInCompany({
      reviewerEmployeeId,
      ratedEmployeeId,
      companyId,
    });
    if (sameCompanyRes.error) {
      return res.status(403).json({ success: false, error: { message: sameCompanyRes.error, code: "FORBIDDEN" } });
    }

    // One per quarter
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
        error: { message: "Feedback already submitted for this quarter", code: "FEEDBACK_EXISTS" },
      });
    }

    // Create feedback
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