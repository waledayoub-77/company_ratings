const supabase = require('../config/database');

/**
 * Create a notification for a user (fire-and-forget friendly).
 * @param {object} opts
 * @param {string} opts.userId   — the user to notify
 * @param {string} opts.type     — e.g. 'employment_approved'
 * @param {string} opts.title    — short heading
 * @param {string} opts.message  — full description
 * @param {string} [opts.link]   — optional frontend route
 */
async function createNotification({ userId, type, title, message, link = null }) {
  const { error } = await supabase.from('notifications').insert({
    user_id: userId,
    type,
    title,
    message,
    link,
  });
  if (error) console.error('createNotification error:', error.message);
}

/**
 * Fetch the latest notifications for a user.
 */
async function getNotifications(userId, { limit = 30 } = {}) {
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) return { error: error.message };
  return { data };
}

/**
 * Mark a single notification as read (owner-guarded).
 */
async function markRead(notificationId, userId) {
  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('id', notificationId)
    .eq('user_id', userId);

  if (error) return { error: error.message };
  return { data: true };
}

/**
 * Mark ALL unread notifications for a user as read.
 */
async function markAllRead(userId) {
  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('user_id', userId)
    .eq('is_read', false);

  if (error) return { error: error.message };
  return { data: true };
}

module.exports = { createNotification, getNotifications, markRead, markAllRead };
