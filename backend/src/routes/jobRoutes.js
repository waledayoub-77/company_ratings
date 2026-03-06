const express = require('express');
const router = express.Router();
const jobController = require('../controllers/jobController');
const { requireAuth } = require('../middlewares/authMiddleware');

// Public routes
router.get('/', jobController.getJobPositions);
router.get('/all', requireAuth, jobController.getAllJobPositions);
router.get('/my-applications', requireAuth, jobController.getMyApplications);
router.get('/:id', jobController.getJobPositionById);

// Authenticated routes
router.post('/', requireAuth, jobController.createJobPosition);
router.patch('/:id/close', requireAuth, jobController.closeJobPosition);
router.delete('/:id', requireAuth, jobController.deleteJobPosition);

// Applications
router.post('/:id/apply', requireAuth, jobController.applyToJob);
router.get('/:id/applications', requireAuth, jobController.getApplications);
router.patch('/applications/:appId/status', requireAuth, jobController.updateApplicationStatus);

module.exports = router;
