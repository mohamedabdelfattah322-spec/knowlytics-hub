const { query } = require('../config/database');
const emailService = require('../services/emailService');
const { createNotification } = require('./notificationController');

// ─── POST /api/admin/broadcast  ──────────────────────────
//  audience: 'all' | 'live' | 'online' | 'enrolled:<courseId>'
const sendBroadcast = async (req, res, next) => {
  try {
    const { subject, body_html, audience = 'all', send_notification = false } = req.body;
    if (!subject || !body_html) return res.status(400).json({ error: 'subject و body_html مطلوبان' });

    let usersQuery = '';
    const params = [];

    if (audience === 'all') {
      usersQuery = `SELECT id, name, email FROM users WHERE is_active = true AND role = 'student'`;
    } else if (audience === 'live') {
      usersQuery = `SELECT id, name, email FROM users WHERE is_active = true AND student_type = 'live'`;
    } else if (audience === 'online') {
      usersQuery = `SELECT id, name, email FROM users WHERE is_active = true AND student_type = 'online'`;
    } else if (audience.startsWith('enrolled:')) {
      const courseId = audience.split(':')[1];
      params.push(courseId);
      usersQuery = `SELECT u.id, u.name, u.email FROM users u
        JOIN enrollments e ON e.user_id = u.id
        WHERE e.course_id = $1 AND e.is_active = true AND u.is_active = true`;
    } else {
      return res.status(400).json({ error: 'audience غير صالح' });
    }

    const usersRes = await query(usersQuery, params);
    const users = usersRes.rows;

    if (!users.length) return res.json({ sent: 0 });

    // Log broadcast first
    const logRes = await query(
      `INSERT INTO broadcast_emails (admin_id, subject, body_html, audience, sent_count)
       VALUES ($1, $2, $3, $4, $5) RETURNING id`,
      [req.user.user_id, subject, body_html, audience, users.length]
    );

    // Send emails + optional in-app notifications (fire-and-forget)
    let sent = 0;
    for (const user of users) {
      try {
        await emailService.sendBroadcastEmail(user.email, subject, body_html);
        sent++;
        if (send_notification) {
          await createNotification(user.id, subject, 'info', null);
        }
      } catch (e) {
        console.error('Broadcast fail for', user.email, e.message);
      }
    }

    res.json({ sent, total: users.length, broadcast_id: logRes.rows[0].id });
  } catch (err) { next(err); }
};

// ─── GET /api/admin/broadcasts  (history) ─────────────────
const getBroadcastHistory = async (req, res, next) => {
  try {
    const result = await query(
      `SELECT b.*, u.name AS admin_name FROM broadcast_emails b
       LEFT JOIN users u ON u.id = b.admin_id
       ORDER BY b.created_at DESC LIMIT 50`
    );
    res.json(result.rows);
  } catch (err) { next(err); }
};

module.exports = { sendBroadcast, getBroadcastHistory };
