const rateLimit = require('express-rate-limit');
const config = require('../config/env');

/**
 * General API rate limiter
 * 100 requests per 15 minutes
 */
const generalLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.maxRequests,
  message: {
    success: false,
    error: {
      message: 'Too many requests. Please try again later.',
      code: 'RATE_LIMIT_EXCEEDED',
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Auth endpoint rate limiter
 * 5 login/register attempts per 15 minutes
 */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,
  message: {
    success: false,
    error: {
      message: 'Too many authentication attempts. Please try again in 15 minutes.',
      code: 'AUTH_RATE_LIMIT_EXCEEDED',
    },
  },
  skipSuccessfulRequests: true,
});

/**
 * Report submission rate limiter
 * 5 reports per 24 hours per user
 */
const reportLimiter = rateLimit({
  windowMs: 24 * 60 * 60 * 1000, // 24 hours
  max: 5,
  message: {
    success: false,
    error: {
      message: 'Report limit exceeded. Maximum 5 reports per day.',
      code: 'REPORT_LIMIT_EXCEEDED',
    },
  },
  keyGenerator: (req) => req.user?.userId || req.ip, // Rate limit by user ID if authenticated
});

module.exports = {
  generalLimiter,
  authLimiter,
  reportLimiter,
};
