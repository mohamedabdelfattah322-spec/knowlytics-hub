const axios = require('axios');
const crypto = require('crypto');
const { query } = require('../config/database');
const emailService = require('../services/emailService');

// ─── Paymob config (from env) ─────────────────────────────
const PAYMOB_API_KEY        = process.env.PAYMOB_API_KEY;
const PAYMOB_INTEGRATION_ID = process.env.PAYMOB_INTEGRATION_ID; // online card integration
const PAYMOB_IFRAME_ID      = process.env.PAYMOB_IFRAME_ID;
const PAYMOB_HMAC_SECRET    = process.env.PAYMOB_HMAC_SECRET;
const PAYMOB_BASE           = 'https://accept.paymob.com/api';

// ─── Helpers ──────────────────────────────────────────────
const getPaymobAuthToken = async () => {
  const { data } = await axios.post(`${PAYMOB_BASE}/auth/tokens`, {
    api_key: PAYMOB_API_KEY,
  });
  return data.token;
};

const createPaymobOrder = async (authToken, amountCents, merchantOrderId) => {
  const { data } = await axios.post(`${PAYMOB_BASE}/ecommerce/orders`, {
    auth_token: authToken,
    delivery_needed: false,
    amount_cents: amountCents,
    currency: 'EGP',
    merchant_order_id: merchantOrderId,
    items: [],
  });
  return data;
};

const createPaymentKey = async (authToken, amountCents, orderId, billing) => {
  const { data } = await axios.post(`${PAYMOB_BASE}/acceptance/payment_keys`, {
    auth_token: authToken,
    amount_cents: amountCents,
    expiration: 3600,
    order_id: orderId,
    billing_data: {
      apartment: 'NA', email: billing.email, floor: 'NA', first_name: billing.first_name,
      street: 'NA', building: 'NA', phone_number: billing.phone, shipping_method: 'NA',
      postal_code: 'NA', city: 'NA', country: 'EG', last_name: billing.last_name, state: 'NA',
    },
    currency: 'EGP',
    integration_id: parseInt(PAYMOB_INTEGRATION_ID),
  });
  return data.token;
};

// ─── POST /api/payments/initiate ────────────────────────
//   Body: { course_id, phone }
//   Auth: student  →  returns { iframe_url, payment_id }
const initiatePayment = async (req, res, next) => {
  try {
    const { course_id, phone } = req.body;
    const userId = req.user.user_id;

    if (!PAYMOB_API_KEY) {
      return res.status(500).json({ error: 'Paymob not configured. Contact admin.' });
    }

    // 1. Load course + user
    const courseRes = await query('SELECT * FROM courses WHERE id = $1 AND is_published = true', [course_id]);
    if (!courseRes.rows.length) return res.status(404).json({ error: 'Course not found' });
    const course = courseRes.rows[0];

    if (course.type === 'live') {
      return res.status(400).json({ error: 'الكورس المباشر لا يُشترى أونلاين — تواصل مع الإدارة' });
    }
    if (parseFloat(course.price) <= 0) {
      return res.status(400).json({ error: 'الكورس مجاني — لا حاجة للدفع' });
    }

    // Already enrolled?
    const enrollRes = await query(
      'SELECT id FROM enrollments WHERE user_id = $1 AND course_id = $2 AND is_active = true',
      [userId, course_id]
    );
    if (enrollRes.rows.length) {
      return res.status(400).json({ error: 'أنت مسجل في الكورس بالفعل' });
    }

    const userRes = await query('SELECT id, name, email FROM users WHERE id = $1', [userId]);
    const user = userRes.rows[0];

    const amountCents = Math.round(parseFloat(course.price) * 100);

    // 2. Insert pending payment row first (we need its ID as merchant_order_id)
    const paymentRes = await query(
      `INSERT INTO payments (user_id, course_id, amount, currency, status, customer_phone, customer_email)
       VALUES ($1, $2, $3, 'EGP', 'pending', $4, $5) RETURNING id`,
      [userId, course_id, course.price, phone, user.email]
    );
    const paymentId = paymentRes.rows[0].id;

    // 3. Paymob: auth → order → payment key
    const authToken = await getPaymobAuthToken();
    const order     = await createPaymobOrder(authToken, amountCents, paymentId);

    await query('UPDATE payments SET paymob_order_id = $1 WHERE id = $2', [String(order.id), paymentId]);

    const [first_name, ...rest] = (user.name || 'Student').split(' ');
    const last_name = rest.join(' ') || 'User';
    const paymentToken = await createPaymentKey(authToken, amountCents, order.id, {
      email: user.email, phone: phone || '01000000000', first_name, last_name,
    });

    const iframeUrl = `${PAYMOB_BASE}/acceptance/iframes/${PAYMOB_IFRAME_ID}?payment_token=${paymentToken}`;

    res.json({ iframe_url: iframeUrl, payment_id: paymentId });
  } catch (err) {
    console.error('Paymob initiate error:', err.response?.data || err.message);
    next(err);
  }
};

// ─── POST /api/payments/webhook  ─────────────────────────
//   Paymob calls this on payment completion (success OR failure).
//   We verify HMAC, then enroll student if success.
const paymobWebhook = async (req, res, next) => {
  try {
    const body = req.body.obj || req.body;
    const receivedHmac = req.query.hmac || req.body.hmac;

    // 1. Verify HMAC (concatenate fields in Paymob's specified order)
    const fields = [
      body.amount_cents, body.created_at, body.currency, body.error_occured,
      body.has_parent_transaction, body.id, body.integration_id, body.is_3d_secure,
      body.is_auth, body.is_capture, body.is_refunded, body.is_standalone_payment,
      body.is_voided, body.order?.id, body.owner, body.pending,
      body.source_data?.pan, body.source_data?.sub_type, body.source_data?.type,
      body.success,
    ].join('');

    const expectedHmac = crypto
      .createHmac('sha512', PAYMOB_HMAC_SECRET)
      .update(fields)
      .digest('hex');

    if (receivedHmac !== expectedHmac) {
      console.warn('Paymob HMAC mismatch — possible spoofing');
      return res.status(401).json({ error: 'Invalid HMAC' });
    }

    // 2. Look up our payment row via merchant_order_id
    const merchantOrderId = body.order?.merchant_order_id;
    if (!merchantOrderId) return res.status(400).json({ error: 'No merchant_order_id' });

    const payRes = await query('SELECT * FROM payments WHERE id = $1', [merchantOrderId]);
    if (!payRes.rows.length) return res.status(404).json({ error: 'Payment not found' });
    const payment = payRes.rows[0];

    const success = body.success === true;
    const newStatus = success ? 'success' : 'failed';

    await query(
      `UPDATE payments
       SET status = $1, paymob_txn_id = $2, payment_method = $3, raw_response = $4,
           paid_at = CASE WHEN $1 = 'success' THEN NOW() ELSE NULL END
       WHERE id = $5`,
      [newStatus, String(body.id), body.source_data?.type || 'card', body, payment.id]
    );

    if (success) {
      // 3. Auto-enroll the student
      const existing = await query(
        'SELECT id FROM enrollments WHERE user_id = $1 AND course_id = $2',
        [payment.user_id, payment.course_id]
      );

      if (existing.rows.length) {
        await query(
          `UPDATE enrollments SET is_active = true, payment_ref = $1, enrolled_at = NOW()
           WHERE user_id = $2 AND course_id = $3`,
          [String(body.id), payment.user_id, payment.course_id]
        );
      } else {
        await query(
          `INSERT INTO enrollments (user_id, course_id, payment_ref) VALUES ($1, $2, $3)`,
          [payment.user_id, payment.course_id, String(body.id)]
        );
      }

      // 4. Email confirmation
      const userRes = await query('SELECT email, name FROM users WHERE id = $1', [payment.user_id]);
      const courseRes = await query('SELECT * FROM courses WHERE id = $1', [payment.course_id]);
      emailService.sendEnrollmentConfirmation(userRes.rows[0], courseRes.rows[0]).catch(() => {});
    }

    res.json({ ok: true });
  } catch (err) {
    console.error('Paymob webhook error:', err);
    next(err);
  }
};

// ─── GET /api/payments/my  ───────────────────────────────
const myPayments = async (req, res, next) => {
  try {
    const result = await query(
      `SELECT p.*, c.title AS course_title
       FROM payments p JOIN courses c ON c.id = p.course_id
       WHERE p.user_id = $1 ORDER BY p.created_at DESC`,
      [req.user.user_id]
    );
    res.json(result.rows);
  } catch (err) { next(err); }
};

// ─── GET /api/payments  (admin)  ─────────────────────────
const listAllPayments = async (req, res, next) => {
  try {
    const { status = '', limit = 100 } = req.query;
    const conditions = [];
    const values = [];
    if (status) { values.push(status); conditions.push(`p.status = $${values.length}`); }
    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    values.push(parseInt(limit));

    const result = await query(
      `SELECT p.*, u.name AS user_name, u.email AS user_email,
              c.title AS course_title, c.price AS course_price
       FROM payments p
       JOIN users u ON u.id = p.user_id
       JOIN courses c ON c.id = p.course_id
       ${where}
       ORDER BY p.created_at DESC LIMIT $${values.length}`,
      values
    );
    res.json(result.rows);
  } catch (err) { next(err); }
};

module.exports = { initiatePayment, paymobWebhook, myPayments, listAllPayments };
