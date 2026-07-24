const router = require('express').Router();
const { authenticate, authorize } = require('../middleware/auth');
const { query } = require('../config/database');

// ─── Public: list consultation types for an instructor ───
router.get('/instructor/:instructorId/types', async (req, res, next) => {
  try {
    const result = await query(
      `SELECT * FROM consultation_types WHERE instructor_id = $1 AND is_active = true ORDER BY type, price`,
      [req.params.instructorId]
    );
    res.json(result.rows);
  } catch (err) { next(err); }
});

// ─── Public: submit a booking ────────────────────────────
router.post('/book', async (req, res, next) => {
  try {
    const { consultation_type_id, instructor_id, name, email, phone, company, description, preferred_date } = req.body;
    if (!name || !email || !consultation_type_id) return res.status(400).json({ error: 'Name, email and consultation type are required' });

    const result = await query(
      `INSERT INTO consultation_bookings (consultation_type_id, instructor_id, user_id, name, email, phone, company, description, preferred_date)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
      [consultation_type_id, instructor_id, req.user?.user_id || null, name, email, phone || null, company || null, description || null, preferred_date || null]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) { next(err); }
});

// ─── Admin: list all bookings ────────────────────────────
router.get('/bookings', authenticate, authorize('admin'), async (req, res, next) => {
  try {
    const result = await query(
      `SELECT b.*, ct.name AS type_name, ct.type AS consultation_type, ct.price,
              i.name AS instructor_name
       FROM consultation_bookings b
       LEFT JOIN consultation_types ct ON ct.id = b.consultation_type_id
       LEFT JOIN instructors i ON i.id = b.instructor_id
       ORDER BY b.created_at DESC`
    );
    res.json(result.rows);
  } catch (err) { next(err); }
});

// ─── Admin: update booking status ────────────────────────
router.put('/bookings/:id', authenticate, authorize('admin'), async (req, res, next) => {
  try {
    const { status, notes } = req.body;
    const result = await query(
      `UPDATE consultation_bookings SET status = $1, notes = $2, updated_at = NOW() WHERE id = $3 RETURNING *`,
      [status, notes, req.params.id]
    );
    res.json(result.rows[0]);
  } catch (err) { next(err); }
});

// ─── Admin: CRUD consultation types ──────────────────────
router.get('/types', authenticate, authorize('admin'), async (req, res, next) => {
  try {
    const result = await query(`SELECT ct.*, i.name AS instructor_name FROM consultation_types ct LEFT JOIN instructors i ON i.id = ct.instructor_id ORDER BY i.name, ct.type`);
    res.json(result.rows);
  } catch (err) { next(err); }
});

router.post('/types', authenticate, authorize('admin'), async (req, res, next) => {
  try {
    const { instructor_id, name, name_ar, type, price, duration_minutes, description, description_ar } = req.body;
    const result = await query(
      `INSERT INTO consultation_types (instructor_id, name, name_ar, type, price, duration_minutes, description, description_ar)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
      [instructor_id, name, name_ar, type, price, duration_minutes || 60, description, description_ar]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) { next(err); }
});

router.put('/types/:id', authenticate, authorize('admin'), async (req, res, next) => {
  try {
    const { name, name_ar, type, price, duration_minutes, description, description_ar, is_active } = req.body;
    const result = await query(
      `UPDATE consultation_types SET name=$1, name_ar=$2, type=$3, price=$4, duration_minutes=$5, description=$6, description_ar=$7, is_active=$8 WHERE id=$9 RETURNING *`,
      [name, name_ar, type, price, duration_minutes, description, description_ar, is_active, req.params.id]
    );
    res.json(result.rows[0]);
  } catch (err) { next(err); }
});

router.delete('/types/:id', authenticate, authorize('admin'), async (req, res, next) => {
  try {
    await query('DELETE FROM consultation_types WHERE id = $1', [req.params.id]);
    res.json({ message: 'Deleted' });
  } catch (err) { next(err); }
});

module.exports = router;
