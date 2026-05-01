const router = require('express').Router();
const { authenticate } = require('../middleware/auth');
const { query } = require('../config/database');

// GET /api/users/progress  — student's full progress overview
router.get('/progress', authenticate, async (req, res, next) => {
  try {
    const result = await query(
      `SELECT
         e.course_id, c.title AS course_title, c.type,
         e.progress_pct, e.enrolled_at, e.completed_at,
         (SELECT COUNT(*) FROM quiz_attempts qa WHERE qa.course_id = e.course_id AND qa.user_id = e.user_id) AS quiz_attempts,
         (SELECT MAX(score_pct) FROM quiz_attempts qa WHERE qa.course_id = e.course_id AND qa.user_id = e.user_id) AS best_score
       FROM enrollments e JOIN courses c ON c.id = e.course_id
       WHERE e.user_id = $1 AND e.is_active = true`,
      [req.user.user_id]
    );
    res.json(result.rows);
  } catch (err) {
    next(err);
  }
});

// GET /api/users/recommendations  — basic content-based recommendation
router.get('/recommendations', authenticate, async (req, res, next) => {
  try {
    const result = await query(
      `SELECT c.id, c.title, c.type, c.thumbnail_url, c.level, c.duration_hours
       FROM courses c
       WHERE c.is_published = true
         AND c.id NOT IN (SELECT course_id FROM enrollments WHERE user_id = $1)
       ORDER BY (SELECT COUNT(*) FROM enrollments WHERE course_id = c.id) DESC
       LIMIT 6`,
      [req.user.user_id]
    );
    res.json(result.rows);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
