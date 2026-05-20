const { query } = require('../config/database');

// GET /api/subscriptions/plans — public list of active plans
const listPlans = async (req, res, next) => {
  try {
    const result = await query(
      'SELECT * FROM subscription_plans WHERE is_active = true ORDER BY price_monthly'
    );
    res.json(result.rows);
  } catch (err) { next(err); }
};

// GET /api/subscriptions/plans/all — admin sees all plans
const listAllPlans = async (req, res, next) => {
  try {
    const result = await query('SELECT * FROM subscription_plans ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) { next(err); }
};

// POST /api/subscriptions/plans (admin)
const createPlan = async (req, res, next) => {
  try {
    const { name, name_ar, description, price_monthly, price_yearly, features, max_courses } = req.body;
    const result = await query(
      `INSERT INTO subscription_plans (name, name_ar, description, price_monthly, price_yearly, features, max_courses)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [name, name_ar, description, price_monthly, price_yearly, JSON.stringify(features || []), max_courses]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) { next(err); }
};

// PUT /api/subscriptions/plans/:id (admin)
const updatePlan = async (req, res, next) => {
  try {
    const { name, name_ar, description, price_monthly, price_yearly, features, max_courses, is_active } = req.body;
    const result = await query(
      `UPDATE subscription_plans SET
       name = COALESCE($1, name), name_ar = COALESCE($2, name_ar),
       description = COALESCE($3, description),
       price_monthly = COALESCE($4, price_monthly),
       price_yearly = COALESCE($5, price_yearly),
       features = COALESCE($6, features),
       max_courses = $7,
       is_active = COALESCE($8, is_active)
       WHERE id = $9 RETURNING *`,
      [name, name_ar, description, price_monthly, price_yearly, features ? JSON.stringify(features) : null, max_courses, is_active, req.params.id]
    );
    if (!result.rows.length) return res.status(404).json({ error: 'Plan not found' });
    res.json(result.rows[0]);
  } catch (err) { next(err); }
};

// GET /api/subscriptions/my — current user's active subscription
const mySubscription = async (req, res, next) => {
  try {
    const result = await query(
      `SELECT us.*, sp.name, sp.name_ar, sp.features, sp.max_courses
       FROM user_subscriptions us
       JOIN subscription_plans sp ON sp.id = us.plan_id
       WHERE us.user_id = $1 AND us.status = 'active'
       ORDER BY us.created_at DESC LIMIT 1`,
      [req.user.user_id]
    );
    res.json(result.rows[0] || null);
  } catch (err) { next(err); }
};

// POST /api/subscriptions/subscribe
const subscribe = async (req, res, next) => {
  try {
    const { plan_id, billing_cycle = 'monthly', payment_method } = req.body;

    // Check plan exists
    const plan = await query('SELECT * FROM subscription_plans WHERE id = $1 AND is_active = true', [plan_id]);
    if (!plan.rows.length) return res.status(404).json({ error: 'Plan not found' });

    // Cancel existing active subscription
    await query(
      "UPDATE user_subscriptions SET status = 'cancelled' WHERE user_id = $1 AND status = 'active'",
      [req.user.user_id]
    );

    const price = billing_cycle === 'yearly' ? plan.rows[0].price_yearly : plan.rows[0].price_monthly;
    const periodEnd = billing_cycle === 'yearly'
      ? new Date(Date.now() + 365 * 86400000)
      : new Date(Date.now() + 30 * 86400000);

    const result = await query(
      `INSERT INTO user_subscriptions (user_id, plan_id, billing_cycle, current_period_end, payment_method)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [req.user.user_id, plan_id, billing_cycle, periodEnd, payment_method]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) { next(err); }
};

// POST /api/subscriptions/cancel
const cancelSubscription = async (req, res, next) => {
  try {
    const result = await query(
      `UPDATE user_subscriptions
       SET cancel_at_period_end = true
       WHERE user_id = $1 AND status = 'active'
       RETURNING *`,
      [req.user.user_id]
    );
    if (!result.rows.length) return res.status(404).json({ error: 'No active subscription' });
    res.json({ message: 'سيتم إلغاء الاشتراك في نهاية الفترة الحالية', subscription: result.rows[0] });
  } catch (err) { next(err); }
};

module.exports = { listPlans, listAllPlans, createPlan, updatePlan, mySubscription, subscribe, cancelSubscription };
