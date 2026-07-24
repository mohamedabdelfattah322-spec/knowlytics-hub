const router = require('express').Router();
const { authenticate, authorize } = require('../middleware/auth');
const { query } = require('../config/database');

// GET /api/instructors — public list
router.get('/', async (_req, res, next) => {
  try {
    const result = await query(
      `SELECT i.*,
              COUNT(DISTINCT c.id)::int AS course_count
       FROM instructors i
       LEFT JOIN courses c ON c.instructor_profile_id = i.id AND c.is_published = true
       WHERE i.is_active = true
       GROUP BY i.id
       ORDER BY i.created_at ASC`
    );
    res.json(result.rows);
  } catch (err) { next(err); }
});

// GET /api/instructors/:id — single instructor
router.get('/:id', async (req, res, next) => {
  try {
    const result = await query(
      `SELECT i.*,
              COUNT(DISTINCT c.id)::int AS course_count
       FROM instructors i
       LEFT JOIN courses c ON c.instructor_profile_id = i.id AND c.is_published = true
       WHERE i.id = $1
       GROUP BY i.id`,
      [req.params.id]
    );
    if (!result.rows.length) return res.status(404).json({ error: 'Instructor not found' });

    // Also get their courses
    const courses = await query(
      `SELECT id, title, type, level, price, duration_hours, avg_rating, review_count, thumbnail_url
       FROM courses WHERE instructor_profile_id = $1 AND is_published = true
       ORDER BY created_at DESC`,
      [req.params.id]
    );

    res.json({ ...result.rows[0], courses: courses.rows });
  } catch (err) { next(err); }
});

// POST /api/instructors — admin create
router.post('/', authenticate, authorize('admin'), async (req, res, next) => {
  try {
    const { name, name_ar, title, title_ar, bio, bio_ar, photo_url, experience_years, trainees_count, rating, specialties, linkedin_url, youtube_url } = req.body;
    const result = await query(
      `INSERT INTO instructors (name, name_ar, title, title_ar, bio, bio_ar, photo_url, experience_years, trainees_count, rating, specialties, linkedin_url, youtube_url)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13) RETURNING *`,
      [name, name_ar, title, title_ar, bio, bio_ar, photo_url, experience_years || 0, trainees_count || 0, rating || 5.0, specialties || [], linkedin_url, youtube_url]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) { next(err); }
});

// PUT /api/instructors/:id — admin update
router.put('/:id', authenticate, authorize('admin'), async (req, res, next) => {
  try {
    const fields = req.body;
    const allowed = ['name', 'name_ar', 'title', 'title_ar', 'bio', 'bio_ar', 'photo_url', 'experience_years', 'trainees_count', 'rating', 'specialties', 'linkedin_url', 'youtube_url', 'is_active'];
    const updates = [];
    const values = [];
    Object.entries(fields).forEach(([k, v]) => {
      if (allowed.includes(k)) { values.push(v); updates.push(`${k} = $${values.length}`); }
    });
    if (!updates.length) return res.status(400).json({ error: 'No valid fields' });
    updates.push(`updated_at = NOW()`);
    values.push(req.params.id);
    const result = await query(`UPDATE instructors SET ${updates.join(', ')} WHERE id = $${values.length} RETURNING *`, values);
    res.json(result.rows[0]);
  } catch (err) { next(err); }
});

// DELETE /api/instructors/:id — admin delete
router.delete('/:id', authenticate, authorize('admin'), async (req, res, next) => {
  try {
    await query('DELETE FROM instructors WHERE id = $1', [req.params.id]);
    res.json({ message: 'Deleted' });
  } catch (err) { next(err); }
});

module.exports = router;
