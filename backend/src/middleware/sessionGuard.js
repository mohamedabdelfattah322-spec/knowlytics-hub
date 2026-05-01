const { query } = require('../config/database');

const MAX_SESSIONS = parseInt(process.env.MAX_SESSIONS_PER_USER || '2');

/**
 * Called after successful login.
 * Creates a new session and enforces per-user device limit.
 * If the user already has MAX_SESSIONS active, the oldest one is revoked.
 */
const createSession = async (userId, token, deviceId, ipAddress) => {
  // Count active sessions for user
  const countResult = await query(
    `SELECT id FROM sessions WHERE user_id = $1 AND is_active = true ORDER BY created_at ASC`,
    [userId]
  );

  const activeSessions = countResult.rows;

  // Evict oldest sessions if over limit
  if (activeSessions.length >= MAX_SESSIONS) {
    const toRevoke = activeSessions.slice(0, activeSessions.length - MAX_SESSIONS + 1);
    const ids = toRevoke.map((s) => s.id);
    await query(
      `UPDATE sessions SET is_active = false, revoked_at = NOW() WHERE id = ANY($1)`,
      [ids]
    );
  }

  // Create new session
  await query(
    `INSERT INTO sessions (user_id, token, device_id, ip_address, is_active)
     VALUES ($1, $2, $3, $4, true)`,
    [userId, token, deviceId, ipAddress]
  );
};

/**
 * Revoke a specific session token (logout).
 */
const revokeSession = async (token) => {
  await query(
    `UPDATE sessions SET is_active = false, revoked_at = NOW() WHERE token = $1`,
    [token]
  );
};

/**
 * Revoke ALL sessions for a user (force logout everywhere).
 */
const revokeAllSessions = async (userId) => {
  await query(
    `UPDATE sessions SET is_active = false, revoked_at = NOW() WHERE user_id = $1`,
    [userId]
  );
};

/**
 * Middleware: detect suspicious multi-IP login.
 * If the same token is used from a different IP, revoke it and force re-login.
 */
const ipGuard = async (req, res, next) => {
  const token = req.token;
  const currentIp = req.ip || req.connection.remoteAddress;

  const result = await query(
    `SELECT ip_address FROM sessions WHERE token = $1 AND is_active = true`,
    [token]
  );

  if (result.rows.length === 0) return next();

  const storedIp = result.rows[0].ip_address;

  // Allow local dev (127.0.0.1 / ::1 flexibility)
  const isLocal = ['127.0.0.1', '::1', '::ffff:127.0.0.1'].includes(currentIp);
  if (!isLocal && storedIp !== currentIp) {
    await revokeSession(token);
    return res.status(401).json({
      error: 'Login detected from a different location. Session terminated for security.',
      code: 'IP_MISMATCH',
    });
  }

  next();
};

module.exports = { createSession, revokeSession, revokeAllSessions, ipGuard };
