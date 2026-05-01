const { query } = require('../config/database');
const { USE_S3 } = require('./fileController');

// GET /api/lessons/:id  — returns lesson + video URL if enrolled
const getLesson = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.user_id;

    const lessonResult = await query(
      `SELECT l.*, s.course_id FROM lessons l JOIN sections s ON s.id = l.section_id WHERE l.id = $1`,
      [id]
    );
    if (!lessonResult.rows.length) return res.status(404).json({ error: 'Lesson not found' });

    const lesson = lessonResult.rows[0];

    // Check enrollment unless admin or lesson is free preview
    if (!lesson.is_preview && req.user.role !== 'admin') {
      const enrollment = await query(
        `SELECT id FROM enrollments WHERE user_id = $1 AND course_id = $2 AND is_active = true`,
        [userId, lesson.course_id]
      );
      if (!enrollment.rows.length) {
        return res.status(403).json({ error: 'Not enrolled in this course' });
      }
    }

    // Build video URL — S3 signed URL or local stream endpoint
    let videoUrl = null;
    if (lesson.video_key) {
      if (USE_S3) {
        const { getSignedVideoUrl } = require('../config/aws');
        videoUrl = await getSignedVideoUrl(lesson.video_key, 3600);
      } else {
        // Local streaming via authenticated endpoint
        videoUrl = `${process.env.BACKEND_URL || 'http://localhost:5000'}/api/files/stream/${lesson.video_key}`;
      }
    }

    // Track progress — mark as accessed
    if (req.user.role !== 'admin') {
      await query(
        `INSERT INTO lesson_progress (user_id, lesson_id, last_accessed)
         VALUES ($1, $2, NOW())
         ON CONFLICT (user_id, lesson_id) DO UPDATE SET last_accessed = NOW(), access_count = lesson_progress.access_count + 1`,
        [userId, id]
      );
      // Recalculate course progress %
      await recalculateCourseProgress(userId, lesson.course_id);
    }

    const { video_key, ...safelesson } = lesson;
    res.json({ lesson: safelesson, videoUrl });
  } catch (err) {
    next(err);
  }
};

// POST /api/lessons  (admin)
const createLesson = async (req, res, next) => {
  try {
    const { section_id, title, type, video_key, duration_minutes, order_index, is_preview = false, content } = req.body;
    const result = await query(
      `INSERT INTO lessons (section_id, title, type, video_key, duration_minutes, order_index, is_preview, content)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [section_id, title, type, video_key, duration_minutes, order_index, is_preview, content]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    next(err);
  }
};

// PUT /api/lessons/:id  (admin)
const updateLesson = async (req, res, next) => {
  try {
    const { id } = req.params;
    const allowed = ['title', 'type', 'video_key', 'duration_minutes', 'order_index', 'is_preview', 'content'];
    const updates = [];
    const values = [];
    Object.entries(req.body).forEach(([k, v]) => {
      if (allowed.includes(k)) { values.push(v); updates.push(`${k} = $${values.length}`); }
    });
    if (!updates.length) return res.status(400).json({ error: 'No valid fields' });
    values.push(id);
    const result = await query(
      `UPDATE lessons SET ${updates.join(', ')}, updated_at = NOW() WHERE id = $${values.length} RETURNING *`,
      values
    );
    res.json(result.rows[0]);
  } catch (err) {
    next(err);
  }
};

// DELETE /api/lessons/:id  (admin)
const deleteLesson = async (req, res, next) => {
  try {
    await query('DELETE FROM lessons WHERE id = $1', [req.params.id]);
    res.json({ message: 'Lesson deleted' });
  } catch (err) {
    next(err);
  }
};

// POST /api/lessons/:id/complete  — student marks lesson complete
const completeLesson = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.user_id;

    const lessonResult = await query(
      `SELECT l.id, s.course_id FROM lessons l JOIN sections s ON s.id = l.section_id WHERE l.id = $1`,
      [id]
    );
    if (!lessonResult.rows.length) return res.status(404).json({ error: 'Lesson not found' });

    await query(
      `INSERT INTO lesson_progress (user_id, lesson_id, completed, completed_at, last_accessed)
       VALUES ($1, $2, true, NOW(), NOW())
       ON CONFLICT (user_id, lesson_id) DO UPDATE SET completed = true, completed_at = NOW()`,
      [userId, id]
    );

    await recalculateCourseProgress(userId, lessonResult.rows[0].course_id);
    res.json({ message: 'Lesson marked as complete' });
  } catch (err) {
    next(err);
  }
};

// Internal helper — updates progress_pct on the enrollment row
const recalculateCourseProgress = async (userId, courseId) => {
  const result = await query(
    `SELECT
       COUNT(l.id) AS total_lessons,
       COUNT(lp.lesson_id) FILTER (WHERE lp.completed = true) AS completed_lessons
     FROM sections s
     JOIN lessons l ON l.section_id = s.id
     LEFT JOIN lesson_progress lp ON lp.lesson_id = l.id AND lp.user_id = $1
     WHERE s.course_id = $2`,
    [userId, courseId]
  );
  const { total_lessons, completed_lessons } = result.rows[0];
  const pct = total_lessons > 0 ? Math.round((completed_lessons / total_lessons) * 100) : 0;

  await query(
    `UPDATE enrollments SET progress_pct = $1, completed_at = CASE WHEN $1 = 100 THEN NOW() ELSE NULL END
     WHERE user_id = $2 AND course_id = $3`,
    [pct, userId, courseId]
  );
};

module.exports = { getLesson, createLesson, updateLesson, deleteLesson, completeLesson };
