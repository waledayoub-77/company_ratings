const express = require('express');
const router = express.Router();
const eotmController = require('../controllers/eotmController');
const { requireAuth } = require('../middlewares/authMiddleware');

// Create EOTM event (company admin)
router.post('/events', requireAuth, eotmController.createEvent);

// Vote in an event (any verified employee)
router.post('/events/:id/vote', requireAuth, eotmController.castVote);

// Close an event and determine winner (company admin)
router.patch('/events/:id/close', requireAuth, eotmController.closeEvent);

// Get all events for a company
router.get('/company/:companyId', requireAuth, eotmController.getCompanyEvents);

// Get nominees/standings for an event
router.get('/events/:id/nominees', requireAuth, eotmController.getEventNominees);

// Get past winners for a company
router.get('/company/:companyId/winners', eotmController.getCompanyWinners);

module.exports = router;
