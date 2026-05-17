/**
 * Notification Routes
 * Get, mark read, and manage notifications for users
 */
const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const { NotificationStore } = require('../store/memoryStore');

// ─── GET /api/notifications — Get user's notifications ─────────────────────────
router.get('/', auth, async (req, res) => {
  try {
    const notifications = await NotificationStore.getByUserId(req.user.id);
    res.json(notifications);
  } catch (err) {
    console.error('Get notifications error:', err);
    res.status(500).json({ error: 'Failed to fetch notifications.' });
  }
});

// ─── PUT /api/notifications/:id/read — Mark notification as read ───────────────
router.put('/:id/read', auth, async (req, res) => {
  try {
    const notification = await NotificationStore.markAsRead(req.params.id);
    if (!notification) return res.status(404).json({ error: 'Notification not found.' });
    res.json(notification);
  } catch (err) {
    console.error('Mark read error:', err);
    res.status(500).json({ error: 'Failed to update notification.' });
  }
});

// ─── PUT /api/notifications/read-all — Mark all as read ────────────────────────
router.put('/read-all', auth, async (req, res) => {
  try {
    await NotificationStore.markAllRead(req.user.id);
    res.json({ success: true });
  } catch (err) {
    console.error('Mark all read error:', err);
    res.status(500).json({ error: 'Failed to update notifications.' });
  }
});

module.exports = router;
