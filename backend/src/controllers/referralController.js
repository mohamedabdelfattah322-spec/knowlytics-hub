const { query } = require('../config/database');
const crypto = require('crypto');

// ──────────────────────────────────────────────
//  HELPERS
// ──────────────────────────────────────────────

const generateCode = () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no I,O,0,1 to avoid confusion
  let code = 'KH-';
  for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
};

const ensureReferralCode = async (userId) => {
  const user = await query('SELECT referral_code FROM users WHERE id = $1', [userId]);
  if (user.rows[0]?.referral_code) return user.rows[0].referral_code;

  // Generate unique code
  let code, exists;
  do {
    code = generateCode();
    exists = await query('SELECT 1 FROM users WHERE referral_code = $1', [code]);
  } while (exists.rows.length > 0);

  await query('UPDATE users SET referral_code = $1 WHERE id = $2', [code, userId]);
  return code;
};

// ──────────────────────────────────────────────
//  STUDENT ENDPOINTS
// ──────────────────────────────────────────────

// GET /api/referrals/my — get my referral info
const getMyReferral = async (req, res, next) => {
  try {
    const code = await ensureReferralCode(req.user.user_id);

    const [stats, referrals, settings] = await Promise.all([
      query(`
        SELECT
          (SELECT COUNT(*) FROM referrals WHERE referrer_id = $1) AS total_referrals,
          (SELECT COUNT(*) FROM referrals WHERE referrer_id = $1 AND status = 'purchased') AS purchased,
          (SELECT COUNT(*) FROM referrals WHERE referrer_id = $1 AND status = 'rewarded') AS rewarded,
          (SELECT COALESCE(SUM(referrer_reward_amount), 0) FROM referrals WHERE referrer_id = $1 AND status = 'rewarded') AS total_earned,
          (SELECT referral_earnings FROM users WHERE id = $1) AS available_balance,
          (SELECT referral_count FROM users WHERE id = $1) AS referral_count
      `, [req.user.user_id]),

      query(`
        SELECT r.id, r.status, r.referrer_reward_amount, r.created_at, r.rewarded_at,
               u.name AS referee_name, c.title AS course_title
        FROM referrals r
        JOIN users u ON u.id = r.referee_id
        LEFT JOIN courses c ON c.id = r.course_id
        WHERE r.referrer_id = $1
        ORDER BY r.created_at DESC
        LIMIT 50
      `, [req.user.user_id]),

      query('SELECT * FROM referral_settings WHERE is_active = true LIMIT 1'),
    ]);

    const s = settings.rows[0] || {};

    res.json({
      referral_code: code,
      referral_link: `${process.env.FRONTEND_URL || 'https://knowlytics-frontend.vercel.app'}/register?ref=${code}`,
      stats: stats.rows[0],
      referrals: referrals.rows,
      reward_info: {
        referrer_reward: `${s.referrer_reward_value}${s.referrer_reward_type === 'percentage' ? '%' : ' EGP'}`,
        referee_discount: `${s.referee_discount_value}${s.referee_discount_type === 'percentage' ? '%' : ' EGP'}`,
        reward_on: s.reward_on || 'first_purchase',
      },
    });
  } catch (err) { next(err); }
};

// POST /api/referrals/apply — apply referral code during registration
const applyReferralCode = async (req, res, next) => {
  try {
    const { referral_code } = req.body;
    const userId = req.user.user_id;

    if (!referral_code) return res.status(400).json({ error: 'Referral code required' });

    // Find referrer
    const referrer = await query(
      'SELECT id, name FROM users WHERE referral_code = $1', [referral_code.toUpperCase()]
    );
    if (!referrer.rows.length) return res.status(404).json({ error: 'Invalid referral code' });

    const referrerId = referrer.rows[0].id;
    if (referrerId === userId) return res.status(400).json({ error: 'Cannot refer yourself' });

    // Check not already referred
    const existing = await query('SELECT referred_by FROM users WHERE id = $1', [userId]);
    if (existing.rows[0]?.referred_by) {
      return res.status(400).json({ error: 'Already used a referral code' });
    }

    // Apply referral
    await query('UPDATE users SET referred_by = $1 WHERE id = $2', [referrerId, userId]);

    // Create referral record
    await query(
      `INSERT INTO referrals (referrer_id, referee_id, status)
       VALUES ($1, $2, 'registered')
       ON CONFLICT (referrer_id, referee_id) DO NOTHING`,
      [referrerId, userId]
    );

    // Update referrer count
    await query(
      'UPDATE users SET referral_count = referral_count + 1 WHERE id = $1',
      [referrerId]
    );

    res.json({
      message: 'Referral applied successfully',
      referrer_name: referrer.rows[0].name,
    });
  } catch (err) { next(err); }
};

// GET /api/referrals/discount — check discount for current user
const getMyDiscount = async (req, res, next) => {
  try {
    const { course_id } = req.query;
    const userId = req.user.user_id;

    // Check if user was referred and hasn't used discount yet
    const user = await query('SELECT referred_by FROM users WHERE id = $1', [userId]);
    if (!user.rows[0]?.referred_by) return res.json({ discount: 0 });

    // Check if already used referral discount (purchased anything)
    const alreadyUsed = await query(
      "SELECT 1 FROM referrals WHERE referee_id = $1 AND status IN ('purchased', 'rewarded')",
      [userId]
    );
    if (alreadyUsed.rows.length) return res.json({ discount: 0 });

    const settings = await query('SELECT * FROM referral_settings WHERE is_active = true LIMIT 1');
    const s = settings.rows[0];
    if (!s) return res.json({ discount: 0 });

    let discount = 0;
    if (course_id) {
      const course = await query('SELECT price FROM courses WHERE id = $1', [course_id]);
      const price = parseFloat(course.rows[0]?.price || 0);
      if (s.referee_discount_type === 'percentage') {
        discount = Math.min(price * (s.referee_discount_value / 100), parseFloat(s.max_reward_per_referral));
      } else {
        discount = Math.min(s.referee_discount_value, price);
      }
    }

    res.json({
      discount: Math.round(discount * 100) / 100,
      discount_type: s.referee_discount_type,
      discount_value: s.referee_discount_value,
    });
  } catch (err) { next(err); }
};

// POST /api/referrals/payout — request withdrawal
const requestPayout = async (req, res, next) => {
  try {
    const { amount, payment_method, payment_details } = req.body;
    const userId = req.user.user_id;

    const user = await query('SELECT referral_earnings FROM users WHERE id = $1', [userId]);
    const balance = parseFloat(user.rows[0]?.referral_earnings || 0);

    if (amount <= 0) return res.status(400).json({ error: 'Invalid amount' });
    if (amount > balance) return res.status(400).json({ error: 'Insufficient balance' });
    if (!payment_method) return res.status(400).json({ error: 'Payment method required' });

    const result = await query(
      `INSERT INTO referral_payouts (user_id, amount, payment_method, payment_details)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [userId, amount, payment_method, payment_details || {}]
    );

    // Deduct from balance
    await query(
      'UPDATE users SET referral_earnings = referral_earnings - $1 WHERE id = $2',
      [amount, userId]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) { next(err); }
};

// ──────────────────────────────────────────────
//  REWARD LOGIC — called after payment success
// ──────────────────────────────────────────────

const processReferralReward = async (userId, paymentId, courseId, amount) => {
  try {
    const user = await query('SELECT referred_by FROM users WHERE id = $1', [userId]);
    const referrerId = user.rows[0]?.referred_by;
    if (!referrerId) return;

    const settings = await query('SELECT * FROM referral_settings WHERE is_active = true LIMIT 1');
    const s = settings.rows[0];
    if (!s) return;

    // Check reward_on policy
    if (s.reward_on === 'first_purchase') {
      const already = await query(
        "SELECT 1 FROM referrals WHERE referee_id = $1 AND status = 'rewarded'",
        [userId]
      );
      if (already.rows.length) return; // already rewarded
    }

    // Calculate reward
    let reward = 0;
    if (s.referrer_reward_type === 'percentage') {
      reward = amount * (s.referrer_reward_value / 100);
    } else {
      reward = s.referrer_reward_value;
    }
    reward = Math.min(reward, parseFloat(s.max_reward_per_referral));

    // Calculate referee discount (already applied at payment time)
    let discount = 0;
    if (s.referee_discount_type === 'percentage') {
      discount = amount * (s.referee_discount_value / 100);
    } else {
      discount = s.referee_discount_value;
    }

    // Update or insert referral record
    await query(
      `INSERT INTO referrals (referrer_id, referee_id, status, referrer_reward_amount, referee_discount_amount, payment_id, course_id, rewarded_at)
       VALUES ($1, $2, 'rewarded', $3, $4, $5, $6, NOW())
       ON CONFLICT (referrer_id, referee_id)
       DO UPDATE SET status = 'rewarded', referrer_reward_amount = $3, referee_discount_amount = $4,
                     payment_id = $5, course_id = $6, rewarded_at = NOW()`,
      [referrerId, userId, reward, discount, paymentId, courseId]
    );

    // Credit referrer balance
    await query(
      'UPDATE users SET referral_earnings = referral_earnings + $1 WHERE id = $2',
      [reward, referrerId]
    );

    // Send notification to referrer
    await query(
      `INSERT INTO notifications (user_id, title, message, type)
       VALUES ($1, 'مكافأة إحالة! 🎉', $2, 'referral')`,
      [referrerId, `حصلت على ${reward.toFixed(2)} جنيه مكافأة إحالة!`]
    ).catch(() => {});

  } catch (err) {
    console.error('Referral reward error:', err.message);
  }
};

// ──────────────────────────────────────────────
//  ADMIN ENDPOINTS
// ──────────────────────────────────────────────

// GET /api/referrals/admin/stats
const getAdminStats = async (req, res, next) => {
  try {
    const [overview, topReferrers, settings, pendingPayouts] = await Promise.all([
      query(`
        SELECT
          COUNT(*) AS total_referrals,
          COUNT(*) FILTER (WHERE status = 'registered') AS registered,
          COUNT(*) FILTER (WHERE status = 'purchased') AS purchased,
          COUNT(*) FILTER (WHERE status = 'rewarded') AS rewarded,
          COALESCE(SUM(referrer_reward_amount), 0) AS total_rewards_paid,
          COALESCE(SUM(referee_discount_amount), 0) AS total_discounts_given
        FROM referrals
      `),

      query(`
        SELECT u.id, u.name, u.email, u.referral_code, u.referral_count, u.referral_earnings,
          COUNT(r.id) AS total_referrals,
          COUNT(r.id) FILTER (WHERE r.status = 'rewarded') AS successful,
          COALESCE(SUM(r.referrer_reward_amount), 0) AS earned
        FROM users u
        LEFT JOIN referrals r ON r.referrer_id = u.id
        WHERE u.referral_count > 0
        GROUP BY u.id, u.name, u.email, u.referral_code, u.referral_count, u.referral_earnings
        ORDER BY earned DESC
        LIMIT 20
      `),

      query('SELECT * FROM referral_settings LIMIT 1'),

      query(`
        SELECT rp.*, u.name, u.email
        FROM referral_payouts rp
        JOIN users u ON u.id = rp.user_id
        WHERE rp.status = 'pending'
        ORDER BY rp.created_at
      `),
    ]);

    res.json({
      overview: overview.rows[0],
      top_referrers: topReferrers.rows,
      settings: settings.rows[0],
      pending_payouts: pendingPayouts.rows,
    });
  } catch (err) { next(err); }
};

// PUT /api/referrals/admin/settings
const updateSettings = async (req, res, next) => {
  try {
    const {
      referrer_reward_type, referrer_reward_value,
      referee_discount_type, referee_discount_value,
      min_purchase_amount, max_reward_per_referral,
      is_active, require_purchase, reward_on,
    } = req.body;

    const result = await query(
      `UPDATE referral_settings SET
        referrer_reward_type = COALESCE($1, referrer_reward_type),
        referrer_reward_value = COALESCE($2, referrer_reward_value),
        referee_discount_type = COALESCE($3, referee_discount_type),
        referee_discount_value = COALESCE($4, referee_discount_value),
        min_purchase_amount = COALESCE($5, min_purchase_amount),
        max_reward_per_referral = COALESCE($6, max_reward_per_referral),
        is_active = COALESCE($7, is_active),
        require_purchase = COALESCE($8, require_purchase),
        reward_on = COALESCE($9, reward_on),
        updated_at = NOW()
       RETURNING *`,
      [referrer_reward_type, referrer_reward_value,
       referee_discount_type, referee_discount_value,
       min_purchase_amount, max_reward_per_referral,
       is_active, require_purchase, reward_on]
    );
    res.json(result.rows[0]);
  } catch (err) { next(err); }
};

// PUT /api/referrals/admin/payouts/:id — approve/reject payout
const processPayout = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, admin_notes } = req.body; // approved, paid, rejected

    if (!['approved', 'paid', 'rejected'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const payout = await query('SELECT * FROM referral_payouts WHERE id = $1', [id]);
    if (!payout.rows.length) return res.status(404).json({ error: 'Not found' });

    await query(
      `UPDATE referral_payouts SET status = $1, admin_notes = $2, processed_at = NOW()
       WHERE id = $3`,
      [status, admin_notes || null, id]
    );

    // If rejected, refund balance
    if (status === 'rejected') {
      await query(
        'UPDATE users SET referral_earnings = referral_earnings + $1 WHERE id = $2',
        [payout.rows[0].amount, payout.rows[0].user_id]
      );
    }

    res.json({ message: `Payout ${status}` });
  } catch (err) { next(err); }
};

module.exports = {
  getMyReferral, applyReferralCode, getMyDiscount, requestPayout,
  processReferralReward,
  getAdminStats, updateSettings, processPayout,
};
