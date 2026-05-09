const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');
const { query } = require('../config/database');
const { createSession, revokeSession } = require('../middleware/sessionGuard');
const emailService = require('../services/emailService');

const signToken = (userId) =>
  jwt.sign({ sub: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });

// POST /api/auth/register
const register = async (req, res, next) => {
  try {
    const { name, email, password, role = 'student', student_type = 'online' } = req.body;

    const existing = await query('SELECT id FROM users WHERE email = $1', [email]);
    if (existing.rows.length > 0) {
      return res.status(409).json({ error: 'Email already registered' });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const result = await query(
      `INSERT INTO users (name, email, password_hash, role, student_type)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, name, email, role, student_type, created_at`,
      [name, email, passwordHash, role, student_type]
    );

    const user = result.rows[0];
    const token = signToken(user.id);
    const deviceId = req.headers['x-device-id'] || uuidv4();

    await createSession(user.id, token, deviceId, req.ip);

    res.status(201).json({ user, token });
  } catch (err) {
    next(err);
  }
};

// POST /api/auth/login
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const result = await query(
      `SELECT id, name, email, password_hash, role, student_type, is_active
       FROM users WHERE email = $1`,
      [email]
    );

    const user = result.rows[0];
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }
    if (!user.is_active) {
      return res.status(403).json({ error: 'Account suspended. Contact support.' });
    }

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const token = signToken(user.id);
    const deviceId = req.headers['x-device-id'] || uuidv4();

    await createSession(user.id, token, deviceId, req.ip);

    const { password_hash, ...safeUser } = user;
    res.json({ user: safeUser, token });
  } catch (err) {
    next(err);
  }
};

// POST /api/auth/logout
const logout = async (req, res, next) => {
  try {
    await revokeSession(req.token);
    res.json({ message: 'Logged out successfully' });
  } catch (err) {
    next(err);
  }
};

// GET /api/auth/me
const me = async (req, res) => {
  const result = await query(
    `SELECT id, name, email, role, student_type, avatar_url, created_at FROM users WHERE id = $1`,
    [req.user.user_id]
  );
  res.json(result.rows[0]);
};

// POST /api/auth/change-password
const changePassword = async (req, res, next) => {
  try {
    const { current_password, new_password } = req.body;
    const result = await query('SELECT password_hash FROM users WHERE id = $1', [req.user.user_id]);
    const valid = await bcrypt.compare(current_password, result.rows[0].password_hash);
    if (!valid) {
      return res.status(400).json({ error: 'Current password is incorrect' });
    }
    const hash = await bcrypt.hash(new_password, 12);
    await query('UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2', [hash, req.user.user_id]);
    res.json({ message: 'Password updated successfully' });
  } catch (err) {
    next(err);
  }
};

// POST /api/auth/forgot-password
//  Body: { email }
//  Always returns 200 (don't leak whether email exists)
const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email is required' });

    const userRes = await query('SELECT id, name, email, is_active FROM users WHERE email = $1', [email]);
    const user = userRes.rows[0];

    // Generic response so we don't leak account existence
    const okResponse = { message: 'إذا كان الحساب موجوداً، سيتم إرسال رابط إعادة التعيين على البريد المسجّل.' };

    if (!user || !user.is_active) return res.json(okResponse);

    // Generate token (32 bytes hex), store hash, send raw token in email
    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');

    // Invalidate previous unused tokens for this user
    await query(
      `UPDATE password_reset_tokens SET used_at = NOW()
       WHERE user_id = $1 AND used_at IS NULL`,
      [user.id]
    );

    await query(
      `INSERT INTO password_reset_tokens (user_id, token_hash, expires_at)
       VALUES ($1, $2, NOW() + INTERVAL '30 minutes')`,
      [user.id, tokenHash]
    );

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const resetUrl = `${frontendUrl}/reset-password?token=${rawToken}`;

    emailService.sendPasswordResetEmail(user, resetUrl).catch((e) =>
      console.error('Failed to send reset email:', e.message)
    );

    res.json(okResponse);
  } catch (err) { next(err); }
};

// POST /api/auth/reset-password
//  Body: { token, new_password }
const resetPassword = async (req, res, next) => {
  try {
    const { token, new_password } = req.body;
    if (!token || !new_password) return res.status(400).json({ error: 'Token and new password are required' });
    if (new_password.length < 6) return res.status(400).json({ error: 'كلمة المرور يجب أن تكون 6 أحرف على الأقل' });

    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    const tRes = await query(
      `SELECT t.*, u.email, u.name FROM password_reset_tokens t
       JOIN users u ON u.id = t.user_id
       WHERE t.token_hash = $1 AND t.used_at IS NULL AND t.expires_at > NOW()
       LIMIT 1`,
      [tokenHash]
    );
    if (!tRes.rows.length) {
      return res.status(400).json({ error: 'الرابط غير صالح أو منتهي الصلاحية. اطلب رابطاً جديداً.' });
    }
    const row = tRes.rows[0];

    const hash = await bcrypt.hash(new_password, 12);
    await query('UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2', [hash, row.user_id]);
    await query('UPDATE password_reset_tokens SET used_at = NOW() WHERE id = $1', [row.id]);

    // Revoke all existing sessions (force re-login on all devices for security)
    await query('UPDATE user_sessions SET is_active = false WHERE user_id = $1', [row.user_id]).catch(() => {});

    res.json({ message: 'تم تغيير كلمة المرور بنجاح. يمكنك الآن تسجيل الدخول.' });
  } catch (err) { next(err); }
};

module.exports = { register, login, logout, me, changePassword, forgotPassword, resetPassword };
