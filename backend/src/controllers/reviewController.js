const { query } = require('../config/database');

// GET /api/courses/:courseId/reviews — public reviews list
const listReviews = async (req, res, next) => {
  try {
    const { courseId } = req.params;
    const { page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    const result = await query(
      `SELECT r.*, u.name AS user_name, u.avatar_url
       FROM course_reviews r
       JOIN users u ON u.id = r.user_id
       WHERE r.course_id = $1 AND r.is_visible = true
       ORDER BY r.created_at DESC
       LIMIT $2 OFFSET $3`,
      [courseId, limit, offset]
    );

    const total = await query(
      'SELECT COUNT(*) FROM course_reviews WHERE course_id = $1 AND is_visible = true',
      [courseId]
    );

    // Rating distribution
    const dist = await query(
      `SELECT rating, COUNT(*)::int AS count
       FROM course_reviews WHERE course_id = $1 AND is_visible = true
       GROUP BY rating ORDER BY rating DESC`,
      [courseId]
    );

    res.json({
      reviews: result.rows,
      total: parseInt(total.rows[0].count),
      distribution: dist.rows,
      page: parseInt(page),
    });
  } catch (err) { next(err); }
};

// POST /api/courses/:courseId/reviews — create/update review (student)
const createReview = async (req, res, next) => {
  try {
    const { courseId } = req.params;
    const { rating, comment } = req.body;

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'Rating must be between 1 and 5' });
    }

    // Must be enrolled
    const enrolled = await query(
      'SELECT 1 FROM enrollments WHERE user_id = $1 AND course_id = $2',
      [req.user.user_id, courseId]
    );
    if (!enrolled.rows.length) {
      return res.status(403).json({ error: 'يجب أن تكون مسجل في الكورس لتقييمه' });
    }

    const result = await query(
      `INSERT INTO course_reviews (course_id, user_id, rating, comment)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (course_id, user_id) DO UPDATE
         SET rating = EXCLUDED.rating, comment = EXCLUDED.comment, updated_at = NOW()
       RETURNING *`,
      [courseId, req.user.user_id, rating, comment]
    );

    // Update avg_rating cache on courses
    await _updateCourseRating(courseId);

    res.status(201).json(result.rows[0]);
  } catch (err) { next(err); }
};

// DELETE /api/courses/:courseId/reviews/:id
const deleteReview = async (req, res, next) => {
  try {
    const { courseId, id } = req.params;
    // Admin can delete any; student can delete own
    const condition = req.user.role === 'admin'
      ? 'id = $1 AND course_id = $2'
      : 'id = $1 AND course_id = $2 AND user_id = $3';
    const params = req.user.role === 'admin'
      ? [id, courseId]
      : [id, courseId, req.user.user_id];

    await query(`DELETE FROM course_reviews WHERE ${condition}`, params);
    await _updateCourseRating(courseId);
    res.json({ message: 'Review deleted' });
  } catch (err) { next(err); }
};

// GET /api/courses/:courseId/reviews/mine
const myReview = async (req, res, next) => {
  try {
    const result = await query(
      'SELECT * FROM course_reviews WHERE course_id = $1 AND user_id = $2',
      [req.params.courseId, req.user.user_id]
    );
    res.json(result.rows[0] || null);
  } catch (err) { next(err); }
};

// Helper: recalc avg_rating + review_count on courses table
async function _updateCourseRating(courseId) {
  await query(
    `UPDATE courses SET
       avg_rating = COALESCE((SELECT AVG(rating)::numeric(3,2) FROM course_reviews WHERE course_id = $1 AND is_visible = true), 0),
       review_count = (SELECT COUNT(*) FROM course_reviews WHERE course_id = $1 AND is_visible = true)
     WHERE id = $1`,
    [courseId]
  );
}

// ─── GET /api/admin/reviews — full feedback analytics for admin ───────────────
const adminGetAllFeedback = async (req, res, next) => {
  try {
    const [courseReviews, courseFeedback, batchFeedback, stats] = await Promise.all([
      query(`
        SELECT cr.*, u.name AS user_name, u.email, u.avatar_url,
               c.title AS course_title
        FROM course_reviews cr
        JOIN users u ON u.id = cr.user_id
        JOIN courses c ON c.id = cr.course_id
        ORDER BY cr.created_at DESC
      `),
      query(`
        SELECT cf.*, u.name AS user_name, u.email, u.avatar_url,
               c.title AS course_title
        FROM course_feedback cf
        JOIN users u ON u.id = cf.user_id
        JOIN courses c ON c.id = cf.course_id
        ORDER BY cf.created_at DESC
      `),
      query(`
        SELECT bf.*, u.name AS user_name, u.email, u.avatar_url,
               cb.name AS batch_name, c.title AS course_title
        FROM batch_feedback bf
        JOIN users u ON u.id = bf.user_id
        JOIN course_batches cb ON cb.id = bf.batch_id
        JOIN courses c ON c.id = cb.course_id
        ORDER BY bf.created_at DESC
      `),
      query(`
        SELECT
          (SELECT COUNT(*)::int FROM course_reviews) AS total_reviews,
          (SELECT COALESCE(AVG(rating),0)::numeric(3,2) FROM course_reviews) AS avg_review_rating,
          (SELECT COUNT(*)::int FROM course_feedback) AS total_course_feedback,
          (SELECT COALESCE(AVG(rating),0)::numeric(3,2) FROM course_feedback) AS avg_course_feedback_rating,
          (SELECT COUNT(*)::int FROM batch_feedback) AS total_batch_feedback,
          (SELECT COALESCE(AVG(rating),0)::numeric(3,2) FROM batch_feedback) AS avg_batch_feedback_rating,
          (SELECT COUNT(*)::int FROM course_reviews WHERE rating = 5) AS five_star,
          (SELECT COUNT(*)::int FROM course_reviews WHERE rating = 4) AS four_star,
          (SELECT COUNT(*)::int FROM course_reviews WHERE rating = 3) AS three_star,
          (SELECT COUNT(*)::int FROM course_reviews WHERE rating <= 2) AS low_star
      `),
    ]);
    res.json({
      stats: stats.rows[0],
      course_reviews: courseReviews.rows,
      course_feedback: courseFeedback.rows,
      batch_feedback: batchFeedback.rows,
    });
  } catch (err) { next(err); }
};

// ─── PATCH /api/admin/reviews/:id/visibility ─────────────────────────────────
const toggleReviewVisibility = async (req, res, next) => {
  try {
    const result = await query(
      `UPDATE course_reviews SET is_visible = NOT is_visible WHERE id = $1 RETURNING *`,
      [req.params.id]
    );
    res.json(result.rows[0]);
  } catch (err) { next(err); }
};

// ─── DELETE /api/admin/reviews/:id ───────────────────────────────────────────
const adminDeleteReview = async (req, res, next) => {
  try {
    await query(`DELETE FROM course_reviews WHERE id = $1`, [req.params.id]);
    res.json({ message: 'Deleted' });
  } catch (err) { next(err); }
};

module.exports = { listReviews, createReview, deleteReview, myReview, adminGetAllFeedback, toggleReviewVisibility, adminDeleteReview };
