const { query } = require('../config/database');
const { deleteObject } = require('../config/aws');

// GET /api/courses  — public listing with filters
const listCourses = async (req, res, next) => {
  try {
    const { type, search, page = 1, limit = 12, admin, category, language, level: lvl, sort } = req.query;
    const offset = (page - 1) * limit;
    const params = [];
    // Admin sees all courses (drafts + published); students see only published
    const conditions = admin === 'true' ? [] : ['c.is_published = true'];

    if (type) { params.push(type); conditions.push(`c.type = $${params.length}`); }
    if (search) { params.push(`%${search}%`); conditions.push(`(c.title ILIKE $${params.length} OR c.description ILIKE $${params.length})`); }
    if (category) { params.push(category); conditions.push(`c.category_id = $${params.length}`); }
    if (language) { params.push(language); conditions.push(`c.language = $${params.length}`); }
    if (lvl) { params.push(lvl); conditions.push(`c.level = $${params.length}`); }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    params.push(limit, offset);

    // Sort options
    let orderBy = 'c.created_at DESC';
    if (sort === 'popular') orderBy = 'enrollment_count DESC';
    else if (sort === 'rating') orderBy = 'c.avg_rating DESC NULLS LAST';
    else if (sort === 'price_low') orderBy = 'c.price ASC';
    else if (sort === 'price_high') orderBy = 'c.price DESC';

    const result = await query(
      `SELECT c.id, c.title, c.description, c.type, c.thumbnail_url, c.price,
              c.level, c.duration_hours, c.created_at, c.category_id, c.language,
              c.short_description, c.avg_rating, c.review_count,
              u.name AS instructor_name,
              cat.name AS category_name, cat.name_ar AS category_name_ar,
              COUNT(DISTINCT e.id) AS enrollment_count
       FROM courses c
       LEFT JOIN users u ON u.id = c.instructor_id
       LEFT JOIN enrollments e ON e.course_id = c.id
       LEFT JOIN categories cat ON cat.id = c.category_id
       ${where}
       GROUP BY c.id, u.name, cat.name, cat.name_ar
       ORDER BY ${orderBy}
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
      `SELECT s.id, s.title, s.description, s.order_index,
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
    const allowed = ['title', 'description', 'type', 'level', 'price', 'duration_hours', 'thumbnail_url', 'is_published', 'default_access_days', 'category_id', 'language', 'short_description'];
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

// ─── POST /api/courses/:id/feedback  (student) ───────
const submitCourseFeedback = async (req, res, next) => {
  try {
    const { kind, rating, expectations, highlights, improvements, recommend } = req.body;
    if (!['first', 'last'].includes(kind)) return res.status(400).json({ error: 'kind must be first|last' });

    // Must be enrolled
    const ok = await query(
      `SELECT 1 FROM enrollments WHERE user_id = $1 AND course_id = $2 AND is_active = true`,
      [req.user.user_id, req.params.id]
    );
    if (!ok.rows.length) return res.status(403).json({ error: 'لازم تكون مسجل في الكورس' });

    const result = await query(
      `INSERT INTO course_feedback (course_id, user_id, kind, rating, expectations, highlights, improvements, recommend)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       ON CONFLICT (course_id, user_id, kind) DO UPDATE
         SET rating = EXCLUDED.rating, expectations = EXCLUDED.expectations,
             highlights = EXCLUDED.highlights, improvements = EXCLUDED.improvements,
             recommend = EXCLUDED.recommend, created_at = NOW()
       RETURNING *`,
      [req.params.id, req.user.user_id, kind, rating || null, expectations || null, highlights || null, improvements || null, recommend ?? null]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) { next(err); }
};

// ─── GET /api/courses/:id/feedback-summary  (public) ─
const courseFeedbackSummary = async (req, res, next) => {
  try {
    const result = await query(
      `SELECT COUNT(*)::int AS total_reviews,
              ROUND(AVG(rating)::numeric, 1) AS avg_rating,
              COUNT(*) FILTER (WHERE recommend = true)::int AS recommend_count
       FROM course_feedback
       WHERE course_id = $1 AND rating IS NOT NULL`,
      [req.params.id]
    );
    res.json(result.rows[0]);
  } catch (err) { next(err); }
};

// ─── GET /api/courses/:id/my-feedback  (student) ─────
const myCourseFeedback = async (req, res, next) => {
  try {
    const result = await query(
      `SELECT * FROM course_feedback WHERE course_id = $1 AND user_id = $2`,
      [req.params.id, req.user.user_id]
    );
    res.json(result.rows);
  } catch (err) { next(err); }
};

// ─── GET /api/courses/:id/feedback  (admin) ──────────
const allCourseFeedback = async (req, res, next) => {
  try {
    const result = await query(
      `SELECT f.*, u.name, u.email FROM course_feedback f
       JOIN users u ON u.id = f.user_id
       WHERE f.course_id = $1
       ORDER BY f.kind, f.created_at DESC`,
      [req.params.id]
    );
    res.json(result.rows);
  } catch (err) { next(err); }
};

// ─── GET /api/courses/:id/final-quiz-status  ────────────
//   Returns lesson progress + final quiz info + user attempt
const finalQuizStatus = async (req, res, next) => {
  try {
    const userId = req.user.user_id;
    const courseId = req.params.id;

    // Total + completed lessons (excluding final-quiz section if it has lessons)
    const lessonsRes = await query(
      `SELECT COUNT(l.id)::int AS total,
              COUNT(lp.lesson_id) FILTER (WHERE lp.completed = true)::int AS completed
       FROM sections s
       JOIN lessons l ON l.section_id = s.id
       LEFT JOIN lesson_progress lp ON lp.lesson_id = l.id AND lp.user_id = $1
       WHERE s.course_id = $2`,
      [userId, courseId]
    );
    const { total, completed } = lessonsRes.rows[0];

    // Final quiz
    const quizRes = await query(
      `SELECT q.id, q.title, q.description, q.passing_score
       FROM quizzes q
       WHERE q.course_id = $1 AND q.is_final = true
       ORDER BY q.created_at DESC LIMIT 1`,
      [courseId]
    );

    // My latest attempt
    let attempt = null;
    if (quizRes.rows.length) {
      const aRes = await query(
        `SELECT score_pct, earned_points, total_points, level, created_at
         FROM quiz_attempts WHERE quiz_id = $1 AND user_id = $2
         ORDER BY created_at DESC LIMIT 1`,
        [quizRes.rows[0].id, userId]
      );
      if (aRes.rows.length) attempt = aRes.rows[0];
    }

    const lessons_done = total > 0 && completed >= total;
    const quiz = quizRes.rows[0] || null;
    const passed = attempt && quiz && attempt.score_pct >= quiz.passing_score;

    res.json({
      total_lessons: total,
      completed_lessons: completed,
      lessons_done,
      final_quiz: quiz,
      my_attempt: attempt,
      passed: !!passed,
      can_get_certificate: !!passed,
    });
  } catch (err) { next(err); }
};

module.exports = { listCourses, getCourse, createCourse, updateCourse, deleteCourse, getCourseAnalytics, submitCourseFeedback, myCourseFeedback, allCourseFeedback, finalQuizStatus, courseFeedbackSummary };
