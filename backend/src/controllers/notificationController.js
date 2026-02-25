const notificationService = require('../services/notificationService');

// GET /api/notifications
exports.getNotifications = async (req, res) => {
  try {
    const userId = req.user?.userId;
    const result = await notificationService.getNotifications(userId, { limit: 30 });
    if (result.error) {
      return res.status(500).json({ success: false, error: { message: result.error } });
    }
    return res.status(200).json({ success: true, data: result.data });
  } catch (err) {
    console.error('getNotifications error:', err);
    return res.status(500).json({ success: false, error: { message: 'Server error' } });
  }
};

// PATCH /api/notifications/read-all
exports.markAllRead = async (req, res) => {
  try {
    const userId = req.user?.userId;
    const result = await notificationService.markAllRead(userId);
    if (result.error) {
      return res.status(500).json({ success: false, error: { message: result.error } });
    }
    return res.status(200).json({ success: true });
  } catch (err) {
    return res.status(500).json({ success: false, error: { message: 'Server error' } });
  }
};

// PATCH /api/notifications/:id/read
exports.markRead = async (req, res) => {
  try {
    const userId = req.user?.userId;
    const { id } = req.params;
    const result = await notificationService.markRead(id, userId);
    if (result.error) {
      return res.status(500).json({ success: false, error: { message: result.error } });
    }
    return res.status(200).json({ success: true });
  } catch (err) {
    return res.status(500).json({ success: false, error: { message: 'Server error' } });
  }
};
