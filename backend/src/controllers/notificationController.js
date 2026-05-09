const { query } = require('../config/database');

// ─── GET /api/notifications  ─────────────────────────────
const getNotifications = async (req, res, next) => {
  try {
    const result = await query(
      `SELECT * FROM notifications WHERE user_id = $1 ORDER BY created_at DESC LIMIT 50`,
      [req.user.user_id]
    );
    const unread = result.rows.filter(n => !n.is_read).length;
    res.json({ notifications: result.rows, unread_count: unread });
  } catch (err) { next(err); }
};

// ─── GET /api/notifications/unread-count  ─────────────────
const getUnreadCount = async (req, res, next) => {
  try {
    const result = await query(
      `SELECT COUNT(*)::int AS count FROM notifications WHERE user_id = $1 AND is_read = false`,
      [req.user.user_id]
    );
    res.json({ count: result.rows[0].count });
  } catch (err) { next(err); }
};

// ─── PATCH /api/notifications/:id/read  ──────────────────
const markOneRead = async (req, res, next) => {
  try {
    await query(
      `UPDATE notifications SET is_read = true WHERE id = $1 AND user_id = $2`,
      [req.params.id, req.user.user_id]
    );
    res.json({ ok: true });
  } catch (err) { next(err); }
};

// ─── POST /api/notifications/mark-all-read  ──────────────
const markAllRead = async (req, res, next) => {
  try {
    await query(
      `UPDATE notifications SET is_read = true WHERE user_id = $1`,
      [req.user.user_id]
    );
    res.json({ ok: true });
  } catch (err) { next(err); }
};

// ─── DELETE /api/notifications/:id  ──────────────────────
const deleteNotification = async (req, res, next) => {
  try {
    await query(
      `DELETE FROM notifications WHERE id = $1 AND user_id = $2`,
      [req.params.id, req.user.user_id]
    );
    res.json({ ok: true });
  } catch (err) { next(err); }
};

// ─── POST /api/notifications/send  (admin broadcast)  ────
const sendNotification = async (req, res, next) => {
  try {
    const { user_id, message, type = 'info', link } = req.body;
    await query(
      `INSERT INTO notifications (user_id, message, type, link) VALUES ($1, $2, $3, $4)`,
      [user_id, message, type, link || null]
    );
    res.status(201).json({ ok: true });
  } catch (err) { next(err); }
};

// ─── POST /api/notifications/broadcast  (admin → all/role) ─
const broadcastNotification = async (req, res, next) => {
  try {
    const { message, type = 'info', link, role } = req.body;
    // Insert for all matching users
    const cond = role ? `WHERE role = $1` : `WHERE 1=1`;
    const params = role ? [role] : [];
    const usersRes = await query(`SELECT id FROM users ${cond}`, params);
    const ids = usersRes.rows.map(u => u.id);
    if (!ids.length) return res.json({ sent: 0 });
    // Bulk insert
    const values = ids.map((id, i) =>
      `($${i * 4 + 1}, $${i * 4 + 2}, $${i * 4 + 3}, $${i * 4 + 4})`
    ).join(', ');
    const flat = ids.flatMap(id => [id, message, type, link || null]);
    await query(
      `INSERT INTO notifications (user_id, message, type, link) VALUES ${values}`,
      flat
    );
    res.json({ sent: ids.length });
  } catch (err) { next(err); }
};

// ─── Helper: create notification for one user (internal) ─
const createNotification = async (userId, message, type = 'info', link = null) => {
  try {
    await query(
      `INSERT INTO notifications (user_id, message, type, link) VALUES ($1, $2, $3, $4)`,
      [userId, message, type, link]
    );
  } catch (err) {
    console.error('createNotification error:', err.message);
  }
};

module.exports = {
  getNotifications, getUnreadCount, markOneRead, markAllRead,
  deleteNotification, sendNotification, broadcastNotification, createNotification,
};
