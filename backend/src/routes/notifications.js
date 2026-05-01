const router = require('express').Router();
const { authenticate, authorize } = require('../middleware/auth');
const emailService = require('../services/emailService');
const { query } = require('../config/database');

// GET /api/notifications  — user's notification list
router.get('/', authenticate, async (req, res, next) => {
  try {
    const result = await query(
      `SELECT * FROM notifications WHERE user_id = $1 ORDER BY created_at DESC LIMIT 50`,
      [req.user.user_id]
    );
    res.json(result.rows);
  } catch (err) {
    next(err);
  }
});

// POST /api/notifications/mark-read
router.post('/mark-read', authenticate, async (req, res, next) => {
  try {
    await query(`UPDATE notifications SET is_read = true WHERE user_id = $1`, [req.user.user_id]);
    res.json({ message: 'All marked as read' });
  } catch (err) {
    next(err);
  }
});

// POST /api/notifications/send  (admin — manual broadcast)
router.post('/send', authenticate, authorize('admin'), async (req, res, next) => {
  try {
    const { user_id, message, type = 'info' } = req.body;
    await query(
      `INSERT INTO notifications (user_id, message, type) VALUES ($1, $2, $3)`,
      [user_id, message, type]
    );
    res.status(201).json({ message: 'Notification sent' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
