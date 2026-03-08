const express = require('express');
const router = express.Router();
const jobController = require('../controllers/jobController');
const { requireAuth } = require('../middlewares/authMiddleware');
const { uploadCV } = require('../config/upload');

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
router.post('/:id/apply', requireAuth, (req, res, next) => {
  uploadCV.single('cv')(req, res, (err) => {
    if (err) return res.status(400).json({ success: false, message: err.message });
    next();
  });
}, jobController.applyToJob);
router.get('/:id/applications', requireAuth, jobController.getApplications);
router.patch('/applications/:appId/status', requireAuth, jobController.updateApplicationStatus);
router.post('/applications/:appId/invite', requireAuth, jobController.sendInvite);
router.post('/applications/:appId/accept-invite', requireAuth, jobController.acceptInvite);

// Serve CV files (authenticated)
router.get('/cv/:filename', requireAuth, jobController.serveCv);

module.exports = router;
