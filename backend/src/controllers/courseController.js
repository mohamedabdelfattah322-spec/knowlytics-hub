const { query } = require('../config/database');
const { deleteObject } = require('../config/aws');

// GET /api/courses  — public listing with filters
const listCourses = async (req, res, next) => {
  try {
    const { type, search, page = 1, limit = 12, admin } = req.query;
    const offset = (page - 1) * limit;
    const params = [];
    // Admin sees all courses (drafts + published); students see only published
    const conditions = admin === 'true' ? [] : ['c.is_published = true'];

    if (type) { params.push(type); conditions.push(`c.type = $${params.length}`); }
    if (search) { params.push(`%${search}%`); conditions.push(`(c.title ILIKE $${params.length} OR c.description ILIKE $${params.length})`); }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    params.push(limit, offset);

    const result = await query(
      `SELECT c.id, c.title, c.description, c.type, c.thumbnail_url, c.price,
              c.level, c.duration_hours, c.created_at,
              u.name AS instructor_name,
              COUNT(DISTINCT e.id) AS enrollment_count
       FROM courses c
       LEFT JOIN users u ON u.id = c.instructor_id
       LEFT JOIN enrollments e ON e.course_id = c.id
       ${where}
       GROUP BY c.id, u.name
       ORDER BY c.created_at DESC
       LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params
    );

    const total = await query(
      `SELECT COUNT(*) FROM courses c ${where}`,
      params.slice(0, params.length - 2)
    );

    res.json({
      courses: result.rows,
      total: parseInt(total.rows[0].count),
      page: parseInt(page),
      totalPages: Math.ceil(parseInt(total.rows[0].count) / limit),
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/courses/:id — full course detail
const getCourse = async (req, res, next) => {
  try {
    const { id } = req.params;
    const courseResult = await query(
      `SELECT c.*, u.name AS instructor_name, u.avatar_url AS instructor_avatar
       FROM courses c
       LEFT JOIN users u ON u.id = c.instructor_id
       WHERE c.id = $1`,
      [id]
    );
    if (!courseResult.rows.length) return res.status(404).json({ error: 'Course not found' });

    const sectionsResult = await query(
      `SELECT s.id, s.title, s.order_index,
              COALESCE(
                json_agg(
                  json_build_object(
                    'id', l.id, 'title', l.title, 'type', l.type,
                    'video_key', l.video_key,
                    'video_url', l.video_url,
                    'duration_minutes', l.duration_minutes, 'order_index', l.order_index,
                    'is_preview', l.is_preview
                  ) ORDER BY l.order_index
                ) FILTER (WHERE l.id IS NOT NULL),
                '[]'::json
              ) AS lessons
       FROM sections s
       LEFT JOIN lessons l ON l.section_id = s.id
       WHERE s.course_id = $1
       GROUP BY s.id
       ORDER BY s.order_index`,
      [id]
    );

    res.json({ course: courseResult.rows[0], sections: sectionsResult.rows });
  } catch (err) {
    next(err);
  }
};

// POST /api/courses  (admin only)
const createCourse = async (req, res, next) => {
  try {
    const { title, description, type, level, price, duration_hours, thumbnail_url } = req.body;
    const result = await query(
      `INSERT INTO courses (title, description, type, level, price, duration_hours, thumbnail_url, instructor_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [title, description, type, level, price || 0, duration_hours || 0, thumbnail_url, req.user.user_id]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    next(err);
  }
};

// PUT /api/courses/:id  (admin only)
const updateCourse = async (req, res, next) => {
  try {
    const { id } = req.params;
    const fields = req.body;
    const allowed = ['title', 'description', 'type', 'level', 'price', 'duration_hours', 'thumbnail_url', 'is_published'];
    const updates = [];
    const values = [];

    Object.entries(fields).forEach(([k, v]) => {
      if (allowed.includes(k)) {
        values.push(v);
        updates.push(`${k} = $${values.length}`);
      }
    });

    if (!updates.length) return res.status(400).json({ error: 'No valid fields to update' });

    values.push(id);
    const result = await query(
      `UPDATE courses SET ${updates.join(', ')}, updated_at = NOW() WHERE id = $${values.length} RETURNING *`,
      values
    );
    if (!result.rows.length) return res.status(404).json({ error: 'Course not found' });
    res.json(result.rows[0]);
  } catch (err) {
    next(err);
  }
};

// DELETE /api/courses/:id  (admin only)
const deleteCourse = async (req, res, next) => {
  try {
    const { id } = req.params;
    // Fetch all lesson video keys before deleting
    const lessons = await query(`SELECT video_key FROM lessons WHERE section_id IN (SELECT id FROM sections WHERE course_id = $1) AND video_key IS NOT NULL`, [id]);
    for (const l of lessons.rows) {
      await deleteObject(l.video_key).catch(() => {}); // best-effort
    }
    await query('DELETE FROM courses WHERE id = $1', [id]);
    res.json({ message: 'Course deleted' });
  } catch (err) {
    next(err);
  }
};

// GET /api/courses/:id/analytics  (admin only)
const getCourseAnalytics = async (req, res, next) => {
  try {
    const { id } = req.params;
    const [enrollments, progress, scores] = await Promise.all([
      query(`SELECT COUNT(*) AS total, COUNT(*) FILTER (WHERE completed_at IS NOT NULL) AS completed FROM enrollments WHERE course_id = $1`, [id]),
      query(`SELECT AVG(progress_pct) AS avg_progress FROM enrollments WHERE course_id = $1`, [id]),
      query(`SELECT AVG(score_pct) AS avg_score, MAX(score_pct) AS top_score FROM quiz_attempts WHERE course_id = $1`, [id]),
    ]);
    res.json({
      enrollments: enrollments.rows[0],
      avg_progress: progress.rows[0].avg_progress,
      quiz_scores: scores.rows[0],
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { listCourses, getCourse, createCourse, updateCourse, deleteCourse, getCourseAnalytics };
