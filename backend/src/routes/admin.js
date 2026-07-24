const router = require('express').Router();
const { authenticate, authorize } = require('../middleware/auth');
const {
  getDashboardStats, listUsers, updateUser, deleteUser,
  createSection, updateSection, deleteSection, listActiveSessions,
} = require('../controllers/adminController');

const guard = [authenticate, authorize('admin')];

router.get('/dashboard', ...guard, getDashboardStats);
router.get('/users', ...guard, listUsers);
router.patch('/users/:id', ...guard, updateUser);
router.delete('/users/:id', ...guard, deleteUser);

// Create user manually (admin only) — used for Live-course students
router.post('/users', ...guard, async (req, res, next) => {
  try {
    const bcrypt = require('bcryptjs');
    const { query } = require('../config/database');
    const emailService = require('../services/emailService');
    const { name, email, password, student_type = 'live', course_id } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'الاسم والإيميل والباسورد مطلوبين' });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: 'كلمة السر لازم 6 حروف على الأقل' });
    }

    const exists = await query('SELECT id FROM users WHERE email = $1', [email]);
    if (exists.rows.length) return res.status(409).json({ error: 'الإيميل ده مسجل بالفعل' });

    const hash = await bcrypt.hash(password, 12);
    const userRes = await query(
      `INSERT INTO users (name, email, password_hash, role, student_type)
       VALUES ($1, $2, $3, 'student', $4)
       RETURNING id, name, email, role, student_type, created_at`,
      [name, email, hash, student_type]
    );
    const newUser = userRes.rows[0];

    // Optionally enroll in a course immediately
    let enrollment = null;
    if (course_id) {
      const enrollRes = await query(
        `INSERT INTO enrollments (user_id, course_id) VALUES ($1, $2)
         ON CONFLICT (user_id, course_id) DO UPDATE SET is_active = true, enrolled_at = NOW()
         RETURNING *`,
        [newUser.id, course_id]
      );
      enrollment = enrollRes.rows[0];

      // Email with credentials
      const courseRes = await query('SELECT * FROM courses WHERE id = $1', [course_id]);
      emailService.sendCredentials?.(newUser, password, courseRes.rows[0]).catch(() => {});
    }

    res.status(201).json({ user: newUser, enrollment });
  } catch (err) { next(err); }
});
router.post('/sections', ...guard, createSection);
router.put('/sections/:id', ...guard, updateSection);
router.delete('/sections/:id', ...guard, deleteSection);
router.get('/sessions', ...guard, listActiveSessions);

// Quick student list for enrollment dropdown
router.get('/students', ...guard, async (req, res, next) => {
  try {
    const { query } = require('../config/database');
    const { search = '' } = req.query;
    const result = await query(
      `SELECT id, name, email FROM users
       WHERE role = 'student'
       AND (name ILIKE $1 OR email ILIKE $1)
       ORDER BY name LIMIT 50`,
      [`%${search}%`]
    );
    res.json(result.rows);
  } catch (err) { next(err); }
});

// Test email connection
router.get('/test-email', ...guard, async (req, res) => {
  try {
    const provider = process.env.RESEND_API_KEY ? 'resend' : 'smtp';
    if (provider === 'resend') {
      const { Resend } = require('resend');
      const resend = new Resend(process.env.RESEND_API_KEY);
      const from = process.env.EMAIL_FROM || 'Knowlytics Hub <Sales@knowlyticshub.com>';
      const to = (process.env.SMTP_USER || 'Sales@knowlyticshub.com').trim();
      await resend.emails.send({ from, to, subject: 'Test Email — Knowlytics Hub', html: '<h2>Resend is working!</h2>' });
      res.json({ success: true, provider: 'resend', message: 'Test email sent to ' + to });
    } else {
      const nodemailer = require('nodemailer');
      const port = (process.env.SMTP_PORT || '587').trim();
      const transporter = nodemailer.createTransport({
        host: (process.env.SMTP_HOST || '').trim(), port: parseInt(port),
        secure: port === '465', requireTLS: port !== '465',
        auth: { user: (process.env.SMTP_USER || '').trim(), pass: (process.env.SMTP_PASS || '').trim() },
        tls: { rejectUnauthorized: false }, connectionTimeout: 10000,
      });
      await transporter.verify();
      await transporter.sendMail({ from: process.env.EMAIL_FROM, to: process.env.SMTP_USER, subject: 'Test Email', html: '<h2>SMTP works!</h2>' });
      res.json({ success: true, provider: 'smtp' });
    }
  } catch (err) {
    res.status(500).json({ success: false, error: err.message, code: err.code,
      provider: process.env.RESEND_API_KEY ? 'resend' : 'smtp',
      resend_key: process.env.RESEND_API_KEY ? '✓ set' : '✗ missing',
    });
  }
});

module.exports = router;
