const feedbackService = require("../services/feedbackService");
const supabase = require("../config/database");

function isInt(n) {
  return Number.isInteger(n);
}

function isIntInRange(n, min, max) {
  return isInt(n) && n >= min && n <= max;
}

exports.createFeedback = async (req, res) => {

  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: { message: "Unauthorized", code: "UNAUTHORIZED" }
      });
    }

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

    //  required
    if (!ratedEmployeeId || !companyId) {
      return res.status(400).json({
        success: false,
        error: {
          message: "Validation failed",
          code: "VALIDATION_ERROR",
          details: [
            { field: "ratedEmployeeId", message: "ratedEmployeeId is required" },
            { field: "companyId", message: "companyId is required" }
          ]
        }
      });
    }

    // validate ratings (1..10 integers)
    if (
      !isIntInRange(professionalism, 1, 5) ||
      !isIntInRange(communication, 1, 5) ||
      !isIntInRange(teamwork, 1, 5) ||
      !isIntInRange(reliability, 1, 5)
    ) {
      return res.status(400).json({
        success: false,
        error: {
          message: "Validation failed",
          code: "VALIDATION_ERROR",
          details: [
            { field: "professionalism", message: "Must be integer 1..10" },
            { field: "communication", message: "Must be integer 1..10" },
            { field: "teamwork", message: "Must be integer 1..10" },
            { field: "reliability", message: "Must be integer 1..10" }
          ]
        }
      });
    }

    // ✅ validate quarter/year
    if (!isIntInRange(quarter, 1, 4) || !isInt(year) || year < 2020 || year > 2100) {
      return res.status(400).json({
        success: false,
        error: {
          message: "Validation failed",
          code: "VALIDATION_ERROR",
          details: [
            { field: "quarter", message: "quarter must be an integer between 1 and 4" },
            { field: "year", message: "year must be a valid integer (e.g., 2026)" }
          ]
        }
      });
    }

    // get reviewer employee id from logged in user
    const reviewerRes = await feedbackService.getEmployeeIdByUserId(userId);

    if (reviewerRes.error) {
      return res.status(400).json({
        success: false,
        error: { message: reviewerRes.error, code: "BAD_REQUEST" }
      });
    }

    const reviewerEmployeeId = reviewerRes.data;

    // ✅ no self-feedback
    if (reviewerEmployeeId === ratedEmployeeId) {
      return res.status(400).json({
        success: false,
        error: {
          message: "Validation failed",
          code: "VALIDATION_ERROR",
          details: [{ field: "ratedEmployeeId", message: "You cannot give feedback to yourself" }]
        }
      });
    }

    // ✅ same company only (both must be approved in the same company)
    const sameCompanyRes = await feedbackService.bothApprovedInCompany({
      reviewerEmployeeId,
      ratedEmployeeId,
      companyId
    });

    if (sameCompanyRes.error) {
      return res.status(400).json({
        success: false,
        error: { message: sameCompanyRes.error, code: "BAD_REQUEST" }
      });
    }

    // ✅ one per quarter
    const existsRes = await feedbackService.feedbackAlreadyExists({
      reviewerEmployeeId,
      ratedEmployeeId,
      companyId,
      quarter,
      year
    });

    if (existsRes.error) {
      return res.status(400).json({
        success: false,
        error: { message: existsRes.error, code: "BAD_REQUEST" }
      });
    }

    if (existsRes.data === true) {
      return res.status(400).json({
        success: false,
        error: {
          message: "Validation failed",
          code: "VALIDATION_ERROR",
          details: [{ field: "quarter", message: "Feedback already submitted for this quarter" }]
        }
      });
    }

    // ✅ create feedback
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

    if (createRes.error) {
      return res.status(400).json({
        success: false,
        error: { message: createRes.error, code: "BAD_REQUEST" }
      });
    }

    return res.status(201).json({
      success: true,
      data: createRes.data
    });
  } catch (e) {
    return res.status(500).json({
      success: false,
      error: { message: "Server error", code: "SERVER_ERROR", detail: e?.message }
    });
  }
};