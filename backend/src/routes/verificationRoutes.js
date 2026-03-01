const express = require('express');
const router = express.Router();
const verificationController = require('../controllers/verificationController');
const { requireAuth } = require('../middlewares/authMiddleware');
const { requireSystemAdmin } = require('../middlewares/roleMiddleware');

// ─── USER: Submit verification requests ───────────────────────────────────────
router.post('/upload-id', requireAuth, verificationController.submitIdentityVerification);
router.post('/upload-company-doc', requireAuth, verificationController.submitCompanyVerification);
router.get('/status', requireAuth, verificationController.getMyVerificationStatus);

// ─── ADMIN: Manage verification requests ──────────────────────────────────────
router.get('/admin/requests', requireAuth, requireSystemAdmin, verificationController.getVerificationRequests);
router.patch('/admin/:id/approve', requireAuth, requireSystemAdmin, verificationController.approveVerification);
router.patch('/admin/:id/reject', requireAuth, requireSystemAdmin, verificationController.rejectVerification);

module.exports = router;
