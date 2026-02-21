const { validationResult } = require("express-validator");

function validate(req, res, next) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: {
          message: "Validation failed",
          code: "VALIDATION_ERROR",
          details: errors.array().map((e) => ({
            field: e.param,
            message: e.msg
          }))
        }
      });
    }
    return next();
  } catch (err) {
    console.error("validateMiddleware error:", err);
    return res.status(500).json({
      success: false,
      error: { message: "Validation middleware error", code: "VALIDATION_MIDDLEWARE_ERROR" }
    });
  }
}

module.exports = { validate };