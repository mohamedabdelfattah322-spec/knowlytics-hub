const router = require('express').Router();
const { authenticate, authorize } = require('../middleware/auth');
const { query } = require('../config/database');
const { upload } = require('../controllers/fileController');

// ── Admin: create assignment for a lesson ─────────────────
router.post('/', authenticate, authorize('admin'), async (req, res, next) => {
  try {
    const { lesson_id, title, description, due_days = 7 } = req.body;
    const result = await query(
      `INSERT INTO assignments (lesson_id, title, description, due_days)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [lesson_id, title, description, due_days]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) { next(err); }
});

// ── Admin: all assignments across all courses with submission stats ──
router.get('/admin/all', authenticate, authorize('admin'), async (req, res, next) => {
  try {
    const result = await query(
      `SELECT a.*, l.title AS lesson_title, c.id AS course_id, c.title AS course_title,
              COUNT(s.id)::int AS submission_count,
              COUNT(CASE WHEN s.grade IS NOT NULL THEN 1 END)::int AS graded_count,
              COUNT(CASE WHEN s.grade IS NULL THEN 1 END)::int AS pending_count
       FROM assignments a
       JOIN lessons l ON l.id = a.lesson_id
       JOIN sections sec ON sec.id = l.section_id
       JOIN courses c ON c.id = sec.course_id
       LEFT JOIN assignment_submissions s ON s.assignment_id = a.id
       GROUP BY a.id, l.title, c.id, c.title
       ORDER BY a.created_at DESC`
    );
    res.json(result.rows);
  } catch (err) { next(err); }
});

// ── Admin: list assignments for a lesson ──────────────────
router.get('/lesson/:lessonId', authenticate, async (req, res, next) => {
  try {
    const result = await query(
      `SELECT a.*,
        (SELECT COUNT(*) FROM assignment_submissions s WHERE s.assignment_id = a.id) AS submission_count
       FROM assignments a WHERE a.lesson_id = $1`,
      [req.params.lessonId]
    );
    res.json(result.rows);
  } catch (err) { next(err); }
});

// ── Admin: list all submissions for an assignment ─────────
router.get('/:id/submissions', authenticate, authorize('admin'), async (req, res, next) => {
  try {
    const result = await query(
      `SELECT s.*, u.name AS student_name, u.email
       FROM assignment_submissions s JOIN users u ON u.id = s.user_id
       WHERE s.assignment_id = $1 ORDER BY s.submitted_at DESC`,
      [req.params.id]
    );
    res.json(result.rows);
  } catch (err) { next(err); }
});

// ── Admin: grade a submission ─────────────────────────────
router.patch('/submissions/:submissionId/grade', authenticate, authorize('admin'), async (req, res, next) => {
  try {
    const { grade, feedback } = req.body;
    const result = await query(
      `UPDATE assignment_submissions SET grade = $1, feedback = $2 WHERE id = $3 RETURNING *`,
      [grade, feedback, req.params.submissionId]
    );
    res.json(result.rows[0]);
  } catch (err) { next(err); }
});

// ── Student: submit assignment ────────────────────────────
router.post('/:id/submit', authenticate, upload.single('file'), async (req, res, next) => {
  try {
    const { notes } = req.body;
    const { USE_S3 } = require('../controllers/fileController');
    const path = require('path');

    let fileKey = null;
    if (req.file) {
      fileKey = USE_S3 ? req.file.key : `files/${req.file.filename}`;
    }

    const result = await query(
      `INSERT INTO assignment_submissions (assignment_id, user_id, file_key, notes)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (assignment_id, user_id) DO UPDATE
         SET file_key = EXCLUDED.file_key, notes = EXCLUDED.notes, submitted_at = NOW()
       RETURNING *`,
      [req.params.id, req.user.user_id, fileKey, notes]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) { next(err); }
});

// ── Student: get my submission ────────────────────────────
router.get('/:id/my-submission', authenticate, async (req, res, next) => {
  try {
    const result = await query(
      `SELECT * FROM assignment_submissions WHERE assignment_id = $1 AND user_id = $2`,
      [req.params.id, req.user.user_id]
    );
    res.json(result.rows[0] || null);
  } catch (err) { next(err); }
});

// ── Admin: delete assignment ──────────────────────────────
router.delete('/:id', authenticate, authorize('admin'), async (req, res, next) => {
  try {
    await query('DELETE FROM assignments WHERE id = $1', [req.params.id]);
    res.json({ message: 'تم حذف التاسك' });
  } catch (err) { next(err); }
});

module.exports = router;
