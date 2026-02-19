const { validationResult } = require('express-validator');

/**
 * Middleware to validate request using express-validator
 * Checks for validation errors and returns standardized error response
 */
const validate = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map(err => ({
      field: err.path,
      message: err.msg,
    }));
    
    return res.status(400).json({
      success: false,
      error: {
        message: 'Validation failed',
        code: 'VALIDATION_ERROR',
        details: errorMessages,
      },
    });
  }
  
  next();
};

module.exports = { validate };
