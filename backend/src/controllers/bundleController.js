const { query } = require('../config/database');

// ─── GET /api/bundles  (public — list active bundles) ────
const listBundles = async (req, res, next) => {
  try {
    const isAdmin = req.user && req.user.role === 'admin';
    const result = await query(
      `SELECT b.*,
              (SELECT COUNT(*) FROM bundle_courses WHERE bundle_id = b.id)::int AS course_count,
              (SELECT COUNT(*) FROM bundle_subscriptions WHERE bundle_id = b.id AND is_active = true)::int AS subscriber_count
       FROM bundles b
       ${isAdmin ? '' : 'WHERE b.is_active = true'}
       ORDER BY b.created_at DESC`
    );
    res.json(result.rows);
  } catch (err) { next(err); }
};

// ─── GET /api/bundles/:id  ────────────────────────────────
const getBundle = async (req, res, next) => {
  try {
    const bundleRes = await query('SELECT * FROM bundles WHERE id = $1', [req.params.id]);
    if (!bundleRes.rows.length) return res.status(404).json({ error: 'Not found' });
    const coursesRes = await query(
      `SELECT c.id, c.title, c.thumbnail_url, c.type, c.level
       FROM bundle_courses bc JOIN courses c ON c.id = bc.course_id
       WHERE bc.bundle_id = $1`,
      [req.params.id]
    );
    res.json({ bundle: bundleRes.rows[0], courses: coursesRes.rows });
  } catch (err) { next(err); }
};

// ─── POST /api/bundles  (admin) ──────────────────────────
const createBundle = async (req, res, next) => {
  try {
    const { name, description, price, original_price, duration_days = 365, thumbnail_url, course_ids = [] } = req.body;
    if (!name || price === undefined) return res.status(400).json({ error: 'name and price required' });

    const r = await query(
      `INSERT INTO bundles (name, description, price, original_price, duration_days, thumbnail_url)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [name, description || null, price, original_price || null, duration_days, thumbnail_url || null]
    );
    const bundle = r.rows[0];

    // Link courses (empty = all courses)
    for (const cid of course_ids) {
      await query(
        `INSERT INTO bundle_courses (bundle_id, course_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
        [bundle.id, cid]
      );
    }
    res.status(201).json(bundle);
  } catch (err) { next(err); }
};

// ─── PATCH /api/bundles/:id  (admin) ─────────────────────
const updateBundle = async (req, res, next) => {
  try {
    const allowed = ['name', 'description', 'price', 'original_price', 'duration_days', 'thumbnail_url', 'is_active'];
    const updates = []; const values = [];
    Object.entries(req.body).forEach(([k, v]) => {
      if (allowed.includes(k)) { values.push(v); updates.push(`${k} = $${values.length}`); }
    });
    if (updates.length) {
      values.push(req.params.id);
      await query(`UPDATE bundles SET ${updates.join(', ')} WHERE id = $${values.length}`, values);
    }
    if (Array.isArray(req.body.course_ids)) {
      await query('DELETE FROM bundle_courses WHERE bundle_id = $1', [req.params.id]);
      for (const cid of req.body.course_ids) {
        await query('INSERT INTO bundle_courses (bundle_id, course_id) VALUES ($1, $2)', [req.params.id, cid]);
      }
    }
    res.json({ ok: true });
  } catch (err) { next(err); }
};

// ─── DELETE /api/bundles/:id  (admin) ────────────────────
const deleteBundle = async (req, res, next) => {
  try {
    await query('DELETE FROM bundles WHERE id = $1', [req.params.id]);
    res.json({ ok: true });
  } catch (err) { next(err); }
};

// ─── GET /api/bundles/my  (student) ─────────────────────
const myBundles = async (req, res, next) => {
  try {
    const result = await query(
      `SELECT bs.id AS subscription_id, bs.started_at, bs.expires_at, bs.is_active,
              b.id AS bundle_id, b.name, b.description, b.thumbnail_url, b.duration_days,
              CASE WHEN bs.expires_at IS NULL OR bs.expires_at > NOW() THEN true ELSE false END AS active_now
       FROM bundle_subscriptions bs
       JOIN bundles b ON b.id = bs.bundle_id
       WHERE bs.user_id = $1
       ORDER BY bs.started_at DESC`,
      [req.user.user_id]
    );
    res.json(result.rows);
  } catch (err) { next(err); }
};

module.exports = { listBundles, getBundle, createBundle, updateBundle, deleteBundle, myBundles };
