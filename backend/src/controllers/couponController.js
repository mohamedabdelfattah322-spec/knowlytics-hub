const { query } = require('../config/database');

// ─── Admin: list, create, update, delete coupons ────────
const listCoupons = async (req, res, next) => {
  try {
    const result = await query(
      `SELECT c.*, co.title AS course_title, b.name AS bundle_title,
              (SELECT COUNT(*) FROM coupon_redemptions WHERE coupon_id = c.id)::int AS redemption_count
       FROM coupons c
       LEFT JOIN courses co ON co.id = c.course_id
       LEFT JOIN bundles b ON b.id = c.bundle_id
       ORDER BY c.created_at DESC`
    );
    res.json(result.rows);
  } catch (err) { next(err); }
};

const createCoupon = async (req, res, next) => {
  try {
    const {
      code, description, discount_type = 'percent', discount_value,
      course_id, bundle_id, audience, max_uses, max_uses_per_user = 1,
      valid_from, valid_until,
    } = req.body;
    if (!code || !discount_value) {
      return res.status(400).json({ error: 'code and discount_value required' });
    }
    const result = await query(
      `INSERT INTO coupons (code, description, discount_type, discount_value, course_id, bundle_id, audience, max_uses, max_uses_per_user, valid_from, valid_until)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING *`,
      [code.toUpperCase().trim(), description || null, discount_type, discount_value,
       course_id || null, bundle_id || null, audience || null, max_uses || null, max_uses_per_user,
       valid_from || null, valid_until || null]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ error: 'الكود ده موجود قبل كده' });
    next(err);
  }
};

const updateCoupon = async (req, res, next) => {
  try {
    const allowed = ['description', 'discount_type', 'discount_value', 'course_id', 'bundle_id',
                     'audience', 'max_uses', 'max_uses_per_user', 'valid_from', 'valid_until', 'is_active'];
    const updates = []; const values = [];
    Object.entries(req.body).forEach(([k, v]) => {
      if (allowed.includes(k)) { values.push(v); updates.push(`${k} = $${values.length}`); }
    });
    if (!updates.length) return res.status(400).json({ error: 'No valid fields' });
    values.push(req.params.id);
    const result = await query(
      `UPDATE coupons SET ${updates.join(', ')} WHERE id = $${values.length} RETURNING *`,
      values
    );
    res.json(result.rows[0]);
  } catch (err) { next(err); }
};

const deleteCoupon = async (req, res, next) => {
  try {
    await query('DELETE FROM coupons WHERE id = $1', [req.params.id]);
    res.json({ message: 'Deleted' });
  } catch (err) { next(err); }
};

// ─── POST /api/coupons/validate  (any authenticated user) ────
//   Body: { code, course_id } OR { code, bundle_id }
//   Returns: { valid, discount_type, discount_value, amount_off, final_price, error? }
const validateCoupon = async (req, res, next) => {
  try {
    const { code, course_id, bundle_id } = req.body;
    if (!code || (!course_id && !bundle_id))
      return res.status(400).json({ error: 'code and course_id or bundle_id required' });

    // Fetch coupon + price of the item being purchased
    let couponRes;
    if (bundle_id) {
      couponRes = await query(
        `SELECT c.*, b.price AS item_price
         FROM coupons c
         LEFT JOIN bundles b ON b.id = $2
         WHERE c.code = $1 AND c.is_active = true`,
        [code.toUpperCase().trim(), bundle_id]
      );
    } else {
      couponRes = await query(
        `SELECT c.*, co.price AS item_price
         FROM coupons c
         LEFT JOIN courses co ON co.id = $2
         WHERE c.code = $1 AND c.is_active = true`,
        [code.toUpperCase().trim(), course_id]
      );
    }

    if (!couponRes.rows.length) return res.status(404).json({ valid: false, error: 'الكود مش صحيح' });
    const c = couponRes.rows[0];

    const now = new Date();
    if (c.valid_from && new Date(c.valid_from) > now)
      return res.json({ valid: false, error: 'الكود لم يبدأ بعد' });
    if (c.valid_until && new Date(c.valid_until) < now)
      return res.json({ valid: false, error: 'الكود انتهت صلاحيته' });

    // Scope check: coupon must match the item being purchased
    if (bundle_id) {
      if (c.bundle_id && c.bundle_id !== bundle_id)
        return res.json({ valid: false, error: 'الكود مش صالح للباقة دي' });
      if (c.course_id)
        return res.json({ valid: false, error: 'الكود ده للكورسات مش للباقات' });
    } else {
      if (c.course_id && c.course_id !== course_id)
        return res.json({ valid: false, error: 'الكود مش صالح للكورس ده' });
      if (c.bundle_id)
        return res.json({ valid: false, error: 'الكود ده للباقات مش للكورسات' });
    }

    if (c.max_uses && c.used_count >= c.max_uses)
      return res.json({ valid: false, error: 'الكود استنفد عدد الاستخدامات' });

    const userUsed = await query(
      `SELECT COUNT(*)::int AS n FROM coupon_redemptions WHERE coupon_id = $1 AND user_id = $2`,
      [c.id, req.user.user_id]
    );
    if (userUsed.rows[0].n >= c.max_uses_per_user)
      return res.json({ valid: false, error: 'استخدمت الكود ده قبل كده' });

    const price = parseFloat(c.item_price || 0);
    const amount_off = c.discount_type === 'percent'
      ? Math.round(price * parseFloat(c.discount_value) / 100 * 100) / 100
      : Math.min(parseFloat(c.discount_value), price);
    const final_price = Math.max(0, price - amount_off);

    res.json({
      valid: true,
      coupon_id: c.id,
      discount_type: c.discount_type,
      discount_value: c.discount_value,
      amount_off,
      original_price: price,
      final_price,
    });
  } catch (err) { next(err); }
};

// ─── GET /api/coupons/:id/redemptions  (admin) ────────────────────────────────
const getCouponRedemptions = async (req, res, next) => {
  try {
    const result = await query(
      `SELECT cr.created_at, u.id AS user_id, u.name, u.email, u.avatar_url,
              co.title AS course_title, p.amount, p.status AS payment_status
       FROM coupon_redemptions cr
       JOIN users u ON u.id = cr.user_id
       LEFT JOIN payments p ON p.id = cr.payment_id
       LEFT JOIN courses co ON co.id = p.course_id
       WHERE cr.coupon_id = $1
       ORDER BY cr.created_at DESC`,
      [req.params.id]
    );
    res.json(result.rows);
  } catch (err) { next(err); }
};

// ─── GET /api/coupons/admin/cart-analytics  (admin) ──────────────────────────
const getCartAnalytics = async (req, res, next) => {
  try {
    const [byEvent, byCourse, recent] = await Promise.all([
      query(`SELECT event_type, COUNT(*)::int AS count, ROUND(SUM(amount))::int AS total_value
             FROM cart_events GROUP BY event_type ORDER BY count DESC`),
      query(`SELECT c.title, ce.event_type, COUNT(*)::int AS count
             FROM cart_events ce JOIN courses c ON c.id = ce.course_id
             WHERE ce.course_id IS NOT NULL
             GROUP BY c.title, ce.event_type ORDER BY count DESC LIMIT 20`),
      query(`SELECT ce.created_at, ce.event_type, u.name, u.email, c.title AS course_title, ce.amount
             FROM cart_events ce
             LEFT JOIN users u ON u.id = ce.user_id
             LEFT JOIN courses c ON c.id = ce.course_id
             ORDER BY ce.created_at DESC LIMIT 50`),
    ]);
    res.json({ by_event: byEvent.rows, by_course: byCourse.rows, recent: recent.rows });
  } catch (err) { next(err); }
};

module.exports = { listCoupons, createCoupon, updateCoupon, deleteCoupon, validateCoupon, getCouponRedemptions, getCartAnalytics };
