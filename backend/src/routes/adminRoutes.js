const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { requireAuth } = require('../middlewares/authMiddleware');
const { requireSystemAdmin } = require('../middlewares/roleMiddleware');
const { reportLimiter } = require('../middlewares/rateLimiter'); // BUG-040 fix

// ─── REPORTS (any authenticated user can submit) ──────────────────────────────
router.post('/reports', requireAuth, reportLimiter, adminController.submitReport);

// ─── ADMIN: REPORTS ───────────────────────────────────────────────────────────
router.get('/admin/reports', requireAuth, requireSystemAdmin, adminController.getReports);
router.get('/admin/reports/stats', requireAuth, requireSystemAdmin, adminController.getReportStats);
router.patch('/admin/reports/:id/resolve', requireAuth, requireSystemAdmin, adminController.resolveReport);

// ─── ADMIN: USERS ───────────────────────────────────────────────────────────────────
router.get('/admin/users', requireAuth, requireSystemAdmin, adminController.getUsers);
router.patch('/admin/users/bulk-suspend', requireAuth, requireSystemAdmin, adminController.bulkSuspendUsers);
router.patch('/admin/users/:id/suspend', requireAuth, requireSystemAdmin, adminController.suspendUser);
router.patch('/admin/users/:id/unsuspend', requireAuth, requireSystemAdmin, adminController.unsuspendUser);
router.delete('/admin/users/:id', requireAuth, requireSystemAdmin, adminController.deleteUser);

// ─── ADMIN: COMPANIES ─────────────────────────────────────────────────────────
router.get('/admin/companies', requireAuth, requireSystemAdmin, adminController.getAdminCompanies);
router.patch('/admin/companies/:id/verify', requireAuth, requireSystemAdmin, adminController.verifyCompany);
router.patch('/admin/companies/:id/reject', requireAuth, requireSystemAdmin, adminController.rejectCompany);

// ─── ADMIN: EMPLOYMENT OVERRIDE ───────────────────────────────────────────────
router.patch('/admin/employments/:id/override', requireAuth, requireSystemAdmin, adminController.overrideEmployment);

// ─── ADMIN: ANALYTICS + AUDIT LOGS ───────────────────────────────────────────
router.get('/admin/analytics',  requireAuth, requireSystemAdmin, adminController.getAnalytics);
router.get('/admin/audit-logs', requireAuth, requireSystemAdmin, adminController.getAuditLogs);

// ─── ADMIN: SENTIMENT MODERATION (ratehub.4) ──────────────────────────
router.get('/admin/sentiment-reviews',              requireAuth, requireSystemAdmin, adminController.getSentimentFlaggedReviews);
router.patch('/admin/users/:id/confirm-suspension', requireAuth, requireSystemAdmin, adminController.confirmPendingSuspension);
router.patch('/admin/users/:id/dismiss-suspension', requireAuth, requireSystemAdmin, adminController.dismissPendingSuspension);

module.exports = router;
