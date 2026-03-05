// EOTY Routes — Feature 7: Employee of the Year
const express = require('express');
const router = express.Router();
const eotyController = require('../controllers/eotyController');
const { requireAuth } = require('../middlewares/authMiddleware');

router.post('/', requireAuth, eotyController.createEvent);
router.post('/nominate', requireAuth, eotyController.nominate);
router.post('/vote', requireAuth, eotyController.vote);
router.patch('/:id/close', requireAuth, eotyController.closeEvent);
router.get('/events', requireAuth, eotyController.getCompanyEvents);
router.get('/company/:companyId', requireAuth, eotyController.getEventsByCompanyId);
router.get('/winners/:companyId', requireAuth, eotyController.getCompanyWinners);
router.get('/:id/nominees', requireAuth, eotyController.getEventNominees);
router.get('/:id/certificate', requireAuth, eotyController.getCertificate);

module.exports = router;
