const express = require('express');
const router = express.Router();
const eotyController = require('../controllers/eotyController');
const { requireAuth } = require('../middlewares/authMiddleware');

// Create EOTY event (company admin)
router.post('/events', requireAuth, eotyController.createEvent);

// Vote in an event (any verified employee)
router.post('/events/:id/vote', requireAuth, eotyController.castVote);

// Close an event (company admin)
router.patch('/events/:id/close', requireAuth, eotyController.closeEvent);

// Get all events for a company
router.get('/company/:companyId', requireAuth, eotyController.getCompanyEvents);

// Get nominees for an event
router.get('/events/:id/nominees', requireAuth, eotyController.getEventNominees);

// Get past winners (public)
router.get('/company/:companyId/winners', eotyController.getCompanyWinners);

module.exports = router;
