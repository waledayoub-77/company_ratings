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
} = require('../utils/validators');

const router = express.Router();

router.post('/reports', requireAuth, reportLimiter, validateReportSubmission, validate, reportController.createReport);
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

module.exports = router;
