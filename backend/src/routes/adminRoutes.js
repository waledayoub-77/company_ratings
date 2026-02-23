const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { requireAuth } = require('../middlewares/authMiddleware');
const { requireSystemAdmin } = require('../middlewares/roleMiddleware');

// ─── REPORTS (any authenticated user can submit) ──────────────────────────────
router.post('/reports', requireAuth, adminController.submitReport);

// ─── ADMIN: REPORTS ───────────────────────────────────────────────────────────
router.get('/admin/reports', requireAuth, requireSystemAdmin, adminController.getReports);
router.patch('/admin/reports/:id/resolve', requireAuth, requireSystemAdmin, adminController.resolveReport);

// ─── ADMIN: USERS ─────────────────────────────────────────────────────────────
router.get('/admin/users', requireAuth, requireSystemAdmin, adminController.getUsers);
router.patch('/admin/users/:id/suspend', requireAuth, requireSystemAdmin, adminController.suspendUser);
router.patch('/admin/users/:id/unsuspend', requireAuth, requireSystemAdmin, adminController.unsuspendUser);
router.delete('/admin/users/:id', requireAuth, requireSystemAdmin, adminController.deleteUser);

// ─── ADMIN: COMPANIES ─────────────────────────────────────────────────────────
router.get('/admin/companies', requireAuth, requireSystemAdmin, adminController.getAdminCompanies);
router.patch('/admin/companies/:id/verify', requireAuth, requireSystemAdmin, adminController.verifyCompany);

// ─── ADMIN: EMPLOYMENT OVERRIDE ───────────────────────────────────────────────
router.patch('/admin/employments/:id/override', requireAuth, requireSystemAdmin, adminController.overrideEmployment);

// ─── ADMIN: ANALYTICS + AUDIT LOGS ───────────────────────────────────────────
router.get('/admin/analytics', requireAuth, requireSystemAdmin, adminController.getAnalytics);
router.get('/admin/audit-logs', requireAuth, requireSystemAdmin, adminController.getAuditLogs);

module.exports = router;
