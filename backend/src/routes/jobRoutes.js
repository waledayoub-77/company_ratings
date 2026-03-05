// Job Routes — Feature 5
const express = require('express');
const router = express.Router();
const jobController = require('../controllers/jobController');
const { requireAuth, optionalAuth } = require('../middlewares/authMiddleware');

// ─── Positions ────────────────────────────────────────────────────────────────
router.post('/', requireAuth, jobController.createPosition);
router.patch('/:id', requireAuth, jobController.updatePosition);
router.delete('/:id', requireAuth, jobController.deletePosition);
router.get('/company/:companyId', optionalAuth, jobController.getCompanyPositions);

// ─── Applications ─────────────────────────────────────────────────────────────
router.post('/apply', requireAuth, jobController.uploadMiddleware, jobController.applyToPosition);
router.get('/my-applications', requireAuth, jobController.getMyApplications);
router.get('/:positionId/applications', requireAuth, jobController.getApplicationsForPosition);
router.patch('/applications/:applicationId/status', requireAuth, jobController.updateApplicationStatus);

module.exports = router;
