const { body, param, query } = require('express-validator');

/**
 * Validation rules for user registration
 */
const validateRegister = [
  body('email')
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail(),
  
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
    .matches(/[A-Z]/)
    .withMessage('Password must contain at least one uppercase letter')
    .matches(/[0-9]/)
    .withMessage('Password must contain at least one number'),
  
  body('role')
    .isIn(['employee', 'company_admin'])
    .withMessage('Role must be either employee or company_admin'),
  
  body('fullName')
    .if(body('role').equals('employee'))
    .notEmpty()
    .withMessage('Full name is required for employees')
    .isLength({ min: 2, max: 255 })
    .withMessage('Full name must be between 2 and 255 characters'),
  
  body('companyName')
    .if(body('role').equals('company_admin'))
    .notEmpty()
    .withMessage('Company name is required for company admins')
    .isLength({ min: 2, max: 255 })
    .withMessage('Company name must be between 2 and 255 characters'),
];

/**
 * Validation rules for user login
 */
const validateLogin = [
  body('email')
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail(),
  
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
];

/**
 * Validation rules for review submission
 */
const validateReview = [
  body('companyId')
    .isUUID()
    .withMessage('Invalid company ID'),
  
  body('overallRating')
    .isInt({ min: 1, max: 5 })
    .withMessage('Rating must be between 1 and 5'),
  
  body('content')
    .isLength({ min: 50, max: 2000 })
    .withMessage('Review content must be between 50 and 2000 characters'),
  
  body('isAnonymous')
    .optional()
    .isBoolean()
    .withMessage('isAnonymous must be a boolean'),
];

/**
 * Validation rules for employment request
 */
const validateEmploymentRequest = [
  body('companyId')
    .isUUID()
    .withMessage('Invalid company ID'),
  
  body('position')
    .notEmpty()
    .withMessage('Position is required')
    .isLength({ min: 2, max: 255 })
    .withMessage('Position must be between 2 and 255 characters'),
  
  body('department')
    .optional()
    .isLength({ max: 100 })
    .withMessage('Department must not exceed 100 characters'),
  
  body('startDate')
    .isISO8601()
    .withMessage('Start date must be a valid date')
    .toDate(),
];

/**
 * Validation rules for internal feedback
 */
const validateFeedback = [
  body('ratedEmployeeId')
    .isUUID()
    .withMessage('Invalid employee ID'),
  
  body('companyId')
    .isUUID()
    .withMessage('Invalid company ID'),
  
  body('professionalism')
    .isInt({ min: 1, max: 5 })
    .withMessage('Professionalism rating must be between 1 and 5'),
  
  body('communication')
    .isInt({ min: 1, max: 5 })
    .withMessage('Communication rating must be between 1 and 5'),
  
  body('teamwork')
    .isInt({ min: 1, max: 5 })
    .withMessage('Teamwork rating must be between 1 and 5'),
  
  body('reliability')
    .isInt({ min: 1, max: 5 })
    .withMessage('Reliability rating must be between 1 and 5'),
  
  body('writtenFeedback')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('Written feedback must not exceed 1000 characters'),
];

/**
 * Validation for UUID parameters
 */
const validateUuidParam = (paramName = 'id') => [
  param(paramName)
    .isUUID()
    .withMessage(`Invalid ${paramName}`),
];

module.exports = {
  validateRegister,
  validateLogin,
  validateReview,
  validateEmploymentRequest,
  validateFeedback,
  validateUuidParam,
};
