const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middlewares/authMiddleware');
const notificationController = require('../controllers/notificationController');

router.use(requireAuth);

// GET  /api/notifications          — fetch latest 30 notifications
router.get('/', notificationController.getNotifications);

// PATCH /api/notifications/read-all — mark all as read (must be before /:id)
router.patch('/read-all', notificationController.markAllRead);

// PATCH /api/notifications/:id/read — mark one as read
router.patch('/:id/read', notificationController.markRead);

module.exports = router;
