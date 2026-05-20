const axios = require('axios');
const crypto = require('crypto');
const { query } = require('../config/database');
const emailService = require('../services/emailService');

// ─── Paymob config (from env) ─────────────────────────────
const PAYMOB_API_KEY        = process.env.PAYMOB_API_KEY;
const PAYMOB_HMAC_SECRET    = process.env.PAYMOB_HMAC_SECRET;
const PAYMOB_IFRAME_ID      = process.env.PAYMOB_IFRAME_ID;

// Per-method integration IDs (each Paymob "integration" = one payment method)
const PAYMOB_INTEGRATIONS = {
  card:     process.env.PAYMOB_INTEGRATION_ID,        // Visa / MasterCard / Meeza
  wallet:   process.env.PAYMOB_WALLET_INTEGRATION_ID, // Vodafone Cash / Etisalat Cash / Orange Money / InstaPay
  kiosk:    process.env.PAYMOB_KIOSK_INTEGRATION_ID,  // Fawry / Aman (cash payment ref)
  valu:     process.env.PAYMOB_VALU_INTEGRATION_ID,   // ValU instalments
};
const PAYMOB_BASE = 'https://accept.paymob.com/api';

// ─── Stripe config ────────────────────────────────────────
const STRIPE_SECRET_KEY     = process.env.STRIPE_SECRET_KEY;
const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET;
const FRONTEND_URL          = process.env.FRONTEND_URL || 'http://localhost:3000';
// Conversion rate EGP → USD for international (Stripe). Override via env.
const EGP_TO_USD = parseFloat(process.env.EGP_TO_USD || '0.021'); // ~ 1 USD ≈ 47 EGP

const stripe = STRIPE_SECRET_KEY ? require('stripe')(STRIPE_SECRET_KEY) : null;

// ───────────────────────────────────────────────────────────
// Paymob helpers
// ───────────────────────────────────────────────────────────
const getPaymobAuthToken = async () => {
  const { data } = await axios.post(`${PAYMOB_BASE}/auth/tokens`, { api_key: PAYMOB_API_KEY });
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

const createPaymentKey = async (authToken, amountCents, orderId, billing, integrationId) => {
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
    integration_id: parseInt(integrationId),
  });
  return data.token;
};

// ───────────────────────────────────────────────────────────
// GET /api/payments/methods
// Returns which payment methods are available based on env config.
// ───────────────────────────────────────────────────────────
const getPaymentMethods = async (req, res) => {
  res.json({
    paymob: {
      enabled: !!PAYMOB_API_KEY,
      methods: {
        card:   !!PAYMOB_INTEGRATIONS.card,
        wallet: !!PAYMOB_INTEGRATIONS.wallet,
        kiosk:  !!PAYMOB_INTEGRATIONS.kiosk,
        valu:   !!PAYMOB_INTEGRATIONS.valu,
      },
    },
    stripe: { enabled: !!stripe },
  });
};

// ───────────────────────────────────────────────────────────
// POST /api/payments/initiate
// Body: { course_id?, bundle_id?, phone, method }
//   method ∈ 'card' | 'wallet' | 'kiosk' | 'valu' | 'stripe'
//   - card / wallet / kiosk / valu → Paymob iframe / direct call
//   - stripe → Stripe Checkout (redirect URL)
// Returns:
//   { type: 'iframe', iframe_url, payment_id }       → card/valu
//   { type: 'wallet', redirect_url, payment_id }     → wallet (Vodafone/Orange/InstaPay)
//   { type: 'kiosk',  reference, payment_id }        → Fawry / Aman cash ref
//   { type: 'redirect', url, payment_id }            → Stripe Checkout
// ───────────────────────────────────────────────────────────
const initiatePayment = async (req, res, next) => {
  try {
    const { course_id, bundle_id, phone, method = 'card', wallet_number } = req.body;
    const userId = req.user.user_id;

    if (!course_id && !bundle_id) {
      return res.status(400).json({ error: 'course_id or bundle_id required' });
    }

    // ── Load item being purchased ──
    let item, itemPriceEgp, itemTitle;
    if (course_id) {
      const r = await query('SELECT * FROM courses WHERE id = $1 AND is_published = true', [course_id]);
      if (!r.rows.length) return res.status(404).json({ error: 'Course not found' });
      item = r.rows[0];
      itemPriceEgp = parseFloat(item.price);
      itemTitle = item.title;
      if (item.type === 'live') return res.status(400).json({ error: 'الكورس المباشر لا يُشترى أونلاين — تواصل مع الإدارة' });
      if (itemPriceEgp <= 0) return res.status(400).json({ error: 'الكورس مجاني — لا حاجة للدفع' });

      const enrollRes = await query(
        'SELECT id FROM enrollments WHERE user_id = $1 AND course_id = $2 AND is_active = true',
        [userId, course_id]
      );
      if (enrollRes.rows.length) return res.status(400).json({ error: 'أنت مسجل في الكورس بالفعل' });
    } else {
      const r = await query('SELECT * FROM bundles WHERE id = $1 AND is_active = true', [bundle_id]);
      if (!r.rows.length) return res.status(404).json({ error: 'Bundle not found' });
      item = r.rows[0];
      itemPriceEgp = parseFloat(item.price);
      itemTitle = item.name;
    }

    const userRes = await query('SELECT id, name, email FROM users WHERE id = $1', [userId]);
    const user = userRes.rows[0];

    // Insert pending payment row
    const paymentRes = await query(
      `INSERT INTO payments (user_id, course_id, bundle_id, amount, currency, status, customer_phone, customer_email, payment_method)
       VALUES ($1, $2, $3, $4, 'EGP', 'pending', $5, $6, $7) RETURNING id`,
      [userId, course_id || null, bundle_id || null, itemPriceEgp, phone || null, user.email, method]
    );
    const paymentId = paymentRes.rows[0].id;

    // ════════════════════════════════════════════════════════
    // STRIPE — international card payments
    // ════════════════════════════════════════════════════════
    if (method === 'stripe') {
      if (!stripe) return res.status(500).json({ error: 'Stripe not configured. Contact admin.' });

      const usdAmount = Math.max(1, Math.round(itemPriceEgp * EGP_TO_USD * 100)); // cents, min $1

      const session = await stripe.checkout.sessions.create({
        mode: 'payment',
        payment_method_types: ['card'],
        line_items: [{
          price_data: {
            currency: 'usd',
            product_data: { name: itemTitle },
            unit_amount: usdAmount,
          },
          quantity: 1,
        }],
        customer_email: user.email,
        client_reference_id: String(paymentId),
        metadata: { payment_id: String(paymentId), user_id: String(userId) },
        success_url: `${FRONTEND_URL}/courses/${course_id || ''}/buy?status=success&payment_id=${paymentId}`,
        cancel_url: `${FRONTEND_URL}/courses/${course_id || ''}/buy?status=cancel&payment_id=${paymentId}`,
      });

      await query(`UPDATE payments SET raw_response = $1 WHERE id = $2`, [{ stripe_session: session.id }, paymentId]);

      return res.json({ type: 'redirect', url: session.url, payment_id: paymentId });
    }

    // ════════════════════════════════════════════════════════
    // PAYMOB — Egypt
    // ════════════════════════════════════════════════════════
    if (!PAYMOB_API_KEY) {
      return res.status(500).json({ error: 'Paymob not configured. Contact admin.' });
    }

    const integrationId = PAYMOB_INTEGRATIONS[method];
    if (!integrationId) {
      return res.status(400).json({ error: `وسيلة الدفع "${method}" غير مفعّلة حالياً` });
    }

    const amountCents = Math.round(itemPriceEgp * 100);

    // Common: auth → order
    const authToken = await getPaymobAuthToken();
    const order     = await createPaymobOrder(authToken, amountCents, paymentId);
    await query('UPDATE payments SET paymob_order_id = $1 WHERE id = $2', [String(order.id), paymentId]);

    const [first_name, ...rest] = (user.name || 'Student').split(' ');
    const last_name = rest.join(' ') || 'User';
    const billing = { email: user.email, phone: phone || '01000000000', first_name, last_name };
    const paymentToken = await createPaymentKey(authToken, amountCents, order.id, billing, integrationId);

    // ─── Card / ValU → iframe ───
    if (method === 'card' || method === 'valu') {
      const iframeUrl = `${PAYMOB_BASE}/acceptance/iframes/${PAYMOB_IFRAME_ID}?payment_token=${paymentToken}`;
      return res.json({ type: 'iframe', iframe_url: iframeUrl, payment_id: paymentId });
    }

    // ─── Wallet (Vodafone Cash / Orange / InstaPay) → direct API ───
    if (method === 'wallet') {
      if (!wallet_number) return res.status(400).json({ error: 'wallet_number required' });
      const { data } = await axios.post(`${PAYMOB_BASE}/acceptance/payments/pay`, {
        source: { identifier: wallet_number, subtype: 'WALLET' },
        payment_token: paymentToken,
      });
      // Paymob returns redirect_url for OTP confirmation
      return res.json({
        type: 'wallet',
        redirect_url: data.redirect_url || data.iframe_redirection_url || null,
        message: data.txn_response_code === 'PENDING'
          ? 'تم إرسال طلب الدفع إلى محفظتك — أكمل عبر تطبيق المحفظة'
          : (data.data?.message || 'في انتظار التأكيد'),
        payment_id: paymentId,
      });
    }

    // ─── Kiosk (Fawry / Aman) → reference number ───
    if (method === 'kiosk') {
      const { data } = await axios.post(`${PAYMOB_BASE}/acceptance/payments/pay`, {
        source: { identifier: 'AGGREGATOR', subtype: 'AGGREGATOR' },
        payment_token: paymentToken,
      });
      const reference = data.data?.bill_reference || data.bill_reference;
      return res.json({
        type: 'kiosk',
        reference,
        message: `ادفع نقداً في فوري/أمان باستخدام الرقم المرجعي: ${reference}`,
        payment_id: paymentId,
      });
    }

    return res.status(400).json({ error: 'Unknown payment method' });
  } catch (err) {
    console.error('Payment initiate error:', err.response?.data || err.message);
    next(err);
  }
};

// ───────────────────────────────────────────────────────────
// Shared helper — fulfil a successful payment
// (creates enrollment / bundle subscription, sends email)
// ───────────────────────────────────────────────────────────
const fulfilPayment = async (payment, txnId, paymentMethod) => {
  await query(
    `UPDATE payments
     SET status = 'success', paymob_txn_id = $1, payment_method = $2, paid_at = NOW()
     WHERE id = $3`,
    [String(txnId || ''), paymentMethod || payment.payment_method, payment.id]
  );

  if (payment.bundle_id) {
    const bundleRes = await query('SELECT duration_days FROM bundles WHERE id = $1', [payment.bundle_id]);
    const days = bundleRes.rows[0]?.duration_days || 0;
    const expiresClause = days > 0 ? `NOW() + INTERVAL '${days} days'` : 'NULL';
    await query(
      `INSERT INTO bundle_subscriptions (user_id, bundle_id, payment_id, expires_at)
       VALUES ($1, $2, $3, ${expiresClause})`,
      [payment.user_id, payment.bundle_id, payment.id]
    );
  } else if (payment.course_id) {
    const courseRes = await query('SELECT default_access_days FROM courses WHERE id = $1', [payment.course_id]);
    const days = courseRes.rows[0]?.default_access_days || 0;
    const expiresClause = days > 0 ? `NOW() + INTERVAL '${days} days'` : 'NULL';

    const existing = await query(
      'SELECT id FROM enrollments WHERE user_id = $1 AND course_id = $2',
      [payment.user_id, payment.course_id]
    );
    if (existing.rows.length) {
      await query(
        `UPDATE enrollments SET is_active = true, payment_ref = $1,
         enrolled_at = NOW(), expires_at = ${expiresClause}
         WHERE user_id = $2 AND course_id = $3`,
        [String(txnId || payment.id), payment.user_id, payment.course_id]
      );
    } else {
      await query(
        `INSERT INTO enrollments (user_id, course_id, payment_ref, expires_at)
         VALUES ($1, $2, $3, ${expiresClause})`,
        [payment.user_id, payment.course_id, String(txnId || payment.id)]
      );
    }
    const userRes = await query('SELECT email, name FROM users WHERE id = $1', [payment.user_id]);
    const courseInfoRes = await query('SELECT * FROM courses WHERE id = $1', [payment.course_id]);
    if (userRes.rows.length && courseInfoRes.rows.length) {
      emailService.sendEnrollmentConfirmation(userRes.rows[0], courseInfoRes.rows[0]).catch(() => {});
    }
  }

  // Track checkout_complete analytics
  query(
    `INSERT INTO cart_events (user_id, course_id, bundle_id, event_type, payment_method, amount)
     VALUES ($1, $2, $3, 'checkout_complete', $4, $5)`,
    [payment.user_id, payment.course_id || null, payment.bundle_id || null,
     paymentMethod || payment.payment_method || 'unknown', payment.amount || 0]
  ).catch(() => {});
};

// ───────────────────────────────────────────────────────────
// POST /api/payments/webhook  — Paymob
// ───────────────────────────────────────────────────────────
const paymobWebhook = async (req, res, next) => {
  try {
    const body = req.body.obj || req.body;
    const receivedHmac = req.query.hmac || req.body.hmac;

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

    const merchantOrderId = body.order?.merchant_order_id;
    if (!merchantOrderId) return res.status(400).json({ error: 'No merchant_order_id' });

    const payRes = await query('SELECT * FROM payments WHERE id = $1', [merchantOrderId]);
    if (!payRes.rows.length) return res.status(404).json({ error: 'Payment not found' });
    const payment = payRes.rows[0];

    const success = body.success === true;

    if (success) {
      await fulfilPayment(payment, body.id, body.source_data?.type || payment.payment_method);
      await query('UPDATE payments SET raw_response = $1 WHERE id = $2', [body, payment.id]);
    } else {
      await query(
        `UPDATE payments SET status = 'failed', paymob_txn_id = $1, raw_response = $2 WHERE id = $3`,
        [String(body.id), body, payment.id]
      );
    }

    res.json({ ok: true });
  } catch (err) {
    console.error('Paymob webhook error:', err);
    next(err);
  }
};

// ───────────────────────────────────────────────────────────
// POST /api/payments/stripe/webhook — Stripe
// (Mounted with raw body parser in app.js)
// ───────────────────────────────────────────────────────────
const stripeWebhook = async (req, res, next) => {
  if (!stripe) return res.status(500).json({ error: 'Stripe not configured' });

  let event;
  try {
    const sig = req.headers['stripe-signature'];
    event = STRIPE_WEBHOOK_SECRET
      ? stripe.webhooks.constructEvent(req.body, sig, STRIPE_WEBHOOK_SECRET)
      : JSON.parse(req.body.toString());
  } catch (err) {
    console.error('Stripe webhook signature error:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      const paymentId = session.metadata?.payment_id || session.client_reference_id;
      if (paymentId) {
        const payRes = await query('SELECT * FROM payments WHERE id = $1', [paymentId]);
        if (payRes.rows.length && payRes.rows[0].status !== 'success') {
          await fulfilPayment(payRes.rows[0], session.payment_intent, 'stripe');
        }
      }
    }
    res.json({ received: true });
  } catch (err) {
    console.error('Stripe fulfilment error:', err);
    next(err);
  }
};

// ───────────────────────────────────────────────────────────
// GET /api/payments/my
// ───────────────────────────────────────────────────────────
const myPayments = async (req, res, next) => {
  try {
    const result = await query(
      `SELECT p.*, COALESCE(c.title, b.name) AS item_title,
              c.title AS course_title, b.name AS bundle_name
       FROM payments p
       LEFT JOIN courses c ON c.id = p.course_id
       LEFT JOIN bundles b ON b.id = p.bundle_id
       WHERE p.user_id = $1 ORDER BY p.created_at DESC`,
      [req.user.user_id]
    );
    res.json(result.rows);
  } catch (err) { next(err); }
};

// ───────────────────────────────────────────────────────────
// GET /api/payments  (admin)
// ───────────────────────────────────────────────────────────
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
              c.title AS course_title, c.price AS course_price,
              b.name AS bundle_name
       FROM payments p
       JOIN users u ON u.id = p.user_id
       LEFT JOIN courses c ON c.id = p.course_id
       LEFT JOIN bundles b ON b.id = p.bundle_id
       ${where}
       ORDER BY p.created_at DESC LIMIT $${values.length}`,
      values
    );
    res.json(result.rows);
  } catch (err) { next(err); }
};

// ───────────────────────────────────────────────────────────
// POST /api/payments/:id/refund  (admin)
// ───────────────────────────────────────────────────────────
const refundPayment = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const payRes = await query('SELECT * FROM payments WHERE id = $1', [id]);
    if (!payRes.rows.length) return res.status(404).json({ error: 'Payment not found' });
    const payment = payRes.rows[0];
    if (payment.status !== 'success') return res.status(400).json({ error: 'Only successful payments can be refunded' });

    await query(`UPDATE payments SET status = 'refunded' WHERE id = $1`, [id]);

    if (payment.course_id) {
      await query(`UPDATE enrollments SET is_active = false WHERE user_id = $1 AND course_id = $2`,
        [payment.user_id, payment.course_id]);
    }
    if (payment.bundle_id) {
      await query(`UPDATE bundle_subscriptions SET is_active = false WHERE payment_id = $1`, [id]);
    }

    await query(
      `INSERT INTO refund_requests (payment_id, admin_id, reason) VALUES ($1, $2, $3)`,
      [id, req.user.user_id, reason || null]
    );

    const { createNotification } = require('./notificationController');
    await createNotification(payment.user_id,
      `تم استرداد مبلغ ${payment.amount} جنيه — ${reason || 'استرداد من الإدارة'}`,
      'info', '/dashboard/student'
    );

    const userRes = await query('SELECT name, email FROM users WHERE id = $1', [payment.user_id]);
    if (userRes.rows.length) {
      emailService.sendRefundEmail(userRes.rows[0], payment, reason).catch(() => {});
    }

    res.json({ ok: true });
  } catch (err) { next(err); }
};

// ───────────────────────────────────────────────────────────
// GET /api/payments/:id/invoice
// ───────────────────────────────────────────────────────────
const getInvoice = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.user_id;
    const isAdmin = req.user.role === 'admin';

    const result = await query(
      `SELECT p.*, u.name AS user_name, u.email AS user_email,
              COALESCE(c.title, b.name) AS item_title,
              c.title AS course_title, b.name AS bundle_name,
              c.type AS course_type, c.level AS course_level
       FROM payments p
       JOIN users u ON u.id = p.user_id
       LEFT JOIN courses c ON c.id = p.course_id
       LEFT JOIN bundles b ON b.id = p.bundle_id
       WHERE p.id = $1`,
      [id]
    );
    if (!result.rows.length) return res.status(404).json({ error: 'Payment not found' });
    const p = result.rows[0];

    if (!isAdmin && p.user_id !== userId) return res.status(403).json({ error: 'Forbidden' });
    if (p.status !== 'success' && p.status !== 'refunded') return res.status(400).json({ error: 'No invoice for pending/failed payments' });

    res.json({
      invoice_number: `INV-${p.id.slice(0, 8).toUpperCase()}`,
      issued_at: p.paid_at || p.created_at,
      status: p.status,
      customer: { name: p.user_name, email: p.user_email, phone: p.customer_phone },
      item_title: p.item_title,
      course_title: p.course_title,
      bundle_name: p.bundle_name,
      amount: parseFloat(p.amount),
      currency: p.currency,
      payment_method: p.payment_method,
      paymob_txn_id: p.paymob_txn_id,
    });
  } catch (err) { next(err); }
};

module.exports = {
  initiatePayment,
  paymobWebhook,
  stripeWebhook,
  getPaymentMethods,
  myPayments,
  listAllPayments,
  refundPayment,
  getInvoice,
};
