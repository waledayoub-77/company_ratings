const express = require('express');
const reportController = require('../controllers/reportController');
const adminController = require('../controllers/adminController');
const { requireAuth } = require('../middlewares/authMiddleware');
const { requireSystemAdmin } = require('../middlewares/roleMiddleware');
const { reportLimiter } = require('../middlewares/rateLimiter');
const { validate } = require('../middlewares/validateMiddleware');
const {
  validateReportSubmission,
  validateReportResolution,
  validateUuidParam,
  validateSuspendUser,
} = require('../utils/validators');

const router = express.Router();

// ─── PUBLIC (any authenticated user) ─────────────────────────────────────────
router.post('/reports', requireAuth, reportLimiter, validateReportSubmission, validate, reportController.createReport);

// ─── ADMIN: Reports ──────────────────────────────────────────────────────────
router.get('/admin/reports', requireAuth, requireSystemAdmin, adminController.getReports);
router.patch(
  '/admin/reports/:id/resolve',
  requireAuth,
  requireSystemAdmin,
  validateUuidParam(),
  validateReportResolution,
  validate,
  adminController.resolveReport
);

// ─── ADMIN: Users ────────────────────────────────────────────────────────────
router.get('/admin/users', requireAuth, requireSystemAdmin, adminController.getUsers);
router.patch(
  '/admin/users/:id/suspend',
  requireAuth,
  requireSystemAdmin,
  validateUuidParam(),
  validateSuspendUser,
  validate,
  adminController.suspendUser
);
router.patch(
  '/admin/users/:id/unsuspend',
  requireAuth,
  requireSystemAdmin,
  validateUuidParam(),
  validate,
  adminController.unsuspendUser
);
router.delete(
  '/admin/users/:id',
  requireAuth,
  requireSystemAdmin,
  validateUuidParam(),
  validate,
  adminController.deleteUser
);

// ─── ADMIN: Companies ────────────────────────────────────────────────────────
router.get('/admin/companies', requireAuth, requireSystemAdmin, adminController.getCompanies);
router.patch(
  '/admin/companies/:id/verify',
  requireAuth,
  requireSystemAdmin,
  validateUuidParam(),
  validate,
  adminController.verifyCompany
);

// ─── ADMIN: Employment Override ──────────────────────────────────────────────
router.patch(
  '/admin/employments/:id/override',
  requireAuth,
  requireSystemAdmin,
  validateUuidParam(),
  validate,
  adminController.overrideEmployment
);

// ─── ADMIN: Analytics & Audit ────────────────────────────────────────────────
router.get('/admin/analytics', requireAuth, requireSystemAdmin, adminController.getAnalytics);
router.get('/admin/audit-logs', requireAuth, requireSystemAdmin, adminController.getAuditLogs);

module.exports = router;
