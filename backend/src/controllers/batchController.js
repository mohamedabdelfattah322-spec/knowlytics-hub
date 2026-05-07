const { query } = require('../config/database');
const emailService = require('../services/emailService');

// ─── GET /api/batches/course/:courseId  (admin) ─────────
const listBatchesForCourse = async (req, res, next) => {
  try {
    const result = await query(
      `SELECT b.*,
              (SELECT COUNT(*) FROM enrollments WHERE batch_id = b.id AND is_active = true)::int AS student_count
       FROM course_batches b
       WHERE b.course_id = $1
       ORDER BY b.start_date DESC NULLS LAST, b.created_at DESC`,
      [req.params.courseId]
    );
    res.json(result.rows);
  } catch (err) { next(err); }
};

// ─── POST /api/batches  (admin) ─────────────────────────
const createBatch = async (req, res, next) => {
  try {
    const { course_id, name, description, start_date, end_date } = req.body;
    if (!course_id || !name) return res.status(400).json({ error: 'course_id and name required' });

    const result = await query(
      `INSERT INTO course_batches (course_id, name, description, start_date, end_date)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [course_id, name, description || null, start_date || null, end_date || null]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) { next(err); }
};

// ─── PATCH /api/batches/:id  (admin) ────────────────────
const updateBatch = async (req, res, next) => {
  try {
    const allowed = ['name', 'description', 'start_date', 'end_date', 'is_active', 'live_url', 'next_session_at', 'total_sessions'];
    const updates = []; const values = [];
    Object.entries(req.body).forEach(([k, v]) => {
      if (allowed.includes(k)) { values.push(v); updates.push(`${k} = $${values.length}`); }
    });
    if (!updates.length) return res.status(400).json({ error: 'No valid fields' });
    values.push(req.params.id);
    const result = await query(
      `UPDATE course_batches SET ${updates.join(', ')} WHERE id = $${values.length} RETURNING *`,
      values
    );
    res.json(result.rows[0]);
  } catch (err) { next(err); }
};

// ─── DELETE /api/batches/:id  (admin) ───────────────────
const deleteBatch = async (req, res, next) => {
  try {
    await query('DELETE FROM course_batches WHERE id = $1', [req.params.id]);
    res.json({ message: 'Batch deleted' });
  } catch (err) { next(err); }
};

// ─── GET /api/batches/:id/students  (admin) ─────────────
const getBatchStudents = async (req, res, next) => {
  try {
    const result = await query(
      `SELECT e.id AS enrollment_id, e.is_active, e.enrolled_at, e.progress_pct,
              u.id, u.name, u.email, u.is_active AS user_active
       FROM enrollments e JOIN users u ON u.id = e.user_id
       WHERE e.batch_id = $1
       ORDER BY e.enrolled_at DESC`,
      [req.params.id]
    );
    res.json(result.rows);
  } catch (err) { next(err); }
};

// ─── POST /api/batches/:id/enroll  (admin) ──────────────
//   Enroll an existing user in this batch (and the parent course)
const enrollInBatch = async (req, res, next) => {
  try {
    const { user_id } = req.body;
    const batchRes = await query('SELECT course_id FROM course_batches WHERE id = $1', [req.params.id]);
    if (!batchRes.rows.length) return res.status(404).json({ error: 'Batch not found' });
    const { course_id } = batchRes.rows[0];

    const existing = await query(
      'SELECT id FROM enrollments WHERE user_id = $1 AND course_id = $2',
      [user_id, course_id]
    );
    let result;
    if (existing.rows.length) {
      result = await query(
        `UPDATE enrollments SET batch_id = $1, is_active = true, enrolled_at = NOW()
         WHERE user_id = $2 AND course_id = $3 RETURNING *`,
        [req.params.id, user_id, course_id]
      );
    } else {
      result = await query(
        `INSERT INTO enrollments (user_id, course_id, batch_id) VALUES ($1, $2, $3) RETURNING *`,
        [user_id, course_id, req.params.id]
      );
    }
    res.status(201).json(result.rows[0]);
  } catch (err) { next(err); }
};

// ─── DELETE /api/batches/:id/students/:userId  (admin) ──
const removeFromBatch = async (req, res, next) => {
  try {
    await query(
      `UPDATE enrollments SET is_active = false WHERE batch_id = $1 AND user_id = $2`,
      [req.params.id, req.params.userId]
    );
    res.json({ message: 'Removed' });
  } catch (err) { next(err); }
};

// ─── GET /api/batches/my  (student) ─────────────────────
const myBatches = async (req, res, next) => {
  try {
    const result = await query(
      `SELECT b.*, c.title AS course_title, c.type AS course_type, c.thumbnail_url,
              e.id AS enrollment_id, e.progress_pct,
              (SELECT COUNT(*) FROM batch_recordings WHERE batch_id = b.id)::int AS recordings_count
       FROM enrollments e
       JOIN course_batches b ON b.id = e.batch_id
       JOIN courses c ON c.id = b.course_id
       WHERE e.user_id = $1 AND e.is_active = true
       ORDER BY b.start_date DESC NULLS LAST`,
      [req.user.user_id]
    );
    res.json(result.rows);
  } catch (err) { next(err); }
};

// ─── Recordings ──────────────────────────────────────────
const listRecordings = async (req, res, next) => {
  try {
    // Check student is in this batch (or admin)
    if (req.user.role !== 'admin') {
      const ok = await query(
        `SELECT 1 FROM enrollments WHERE user_id = $1 AND batch_id = $2 AND is_active = true`,
        [req.user.user_id, req.params.id]
      );
      if (!ok.rows.length) return res.status(403).json({ error: 'Not in this batch' });
    }
    const result = await query(
      `SELECT * FROM batch_recordings WHERE batch_id = $1 ORDER BY recorded_at DESC NULLS LAST, created_at DESC`,
      [req.params.id]
    );
    res.json(result.rows);
  } catch (err) { next(err); }
};

const addRecording = async (req, res, next) => {
  try {
    const { title, video_key, recording_url, duration_minutes, recorded_at } = req.body;
    const result = await query(
      `INSERT INTO batch_recordings (batch_id, title, video_key, recording_url, duration_minutes, recorded_at)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [req.params.id, title, video_key || null, recording_url || null, duration_minutes || null, recorded_at || null]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) { next(err); }
};

const deleteRecording = async (req, res, next) => {
  try {
    await query('DELETE FROM batch_recordings WHERE id = $1', [req.params.recordingId]);
    res.json({ message: 'Deleted' });
  } catch (err) { next(err); }
};

// ─── Chat ────────────────────────────────────────────────
const getMessages = async (req, res, next) => {
  try {
    if (req.user.role !== 'admin') {
      const ok = await query(
        `SELECT 1 FROM enrollments WHERE user_id = $1 AND batch_id = $2 AND is_active = true`,
        [req.user.user_id, req.params.id]
      );
      if (!ok.rows.length) return res.status(403).json({ error: 'Not in this batch' });
    }
    const { since } = req.query; // optional: only messages after timestamp
    const params = [req.params.id];
    let where = 'WHERE m.batch_id = $1';
    if (since) { params.push(since); where += ` AND m.created_at > $${params.length}`; }

    const result = await query(
      `SELECT m.id, m.content, m.created_at, m.user_id,
              u.name AS user_name, u.role AS user_role
       FROM batch_messages m
       JOIN users u ON u.id = m.user_id
       ${where}
       ORDER BY m.created_at ASC LIMIT 500`,
      params
    );
    res.json(result.rows);
  } catch (err) { next(err); }
};

const postMessage = async (req, res, next) => {
  try {
    const { content } = req.body;
    if (!content || !content.trim()) return res.status(400).json({ error: 'Message is empty' });
    if (content.length > 2000) return res.status(400).json({ error: 'Message too long' });

    if (req.user.role !== 'admin') {
      const ok = await query(
        `SELECT 1 FROM enrollments WHERE user_id = $1 AND batch_id = $2 AND is_active = true`,
        [req.user.user_id, req.params.id]
      );
      if (!ok.rows.length) return res.status(403).json({ error: 'Not in this batch' });
    }

    const result = await query(
      `INSERT INTO batch_messages (batch_id, user_id, content) VALUES ($1, $2, $3)
       RETURNING id, content, created_at, user_id`,
      [req.params.id, req.user.user_id, content.trim()]
    );
    const msg = result.rows[0];
    res.status(201).json({
      ...msg,
      user_name: req.user.name,
      user_role: req.user.role,
    });
  } catch (err) { next(err); }
};

const deleteMessage = async (req, res, next) => {
  try {
    // Only admin can delete any message; users can delete their own
    const msgRes = await query('SELECT user_id FROM batch_messages WHERE id = $1', [req.params.messageId]);
    if (!msgRes.rows.length) return res.status(404).json({ error: 'Not found' });
    if (req.user.role !== 'admin' && msgRes.rows[0].user_id !== req.user.user_id) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    await query('DELETE FROM batch_messages WHERE id = $1', [req.params.messageId]);
    res.json({ message: 'Deleted' });
  } catch (err) { next(err); }
};

// ─── POST /api/batches/:id/notify  (admin) ─────────────
//   Send session-start email to all batch students.
const notifySession = async (req, res, next) => {
  try {
    const { topic } = req.body;
    const batchRes = await query(
      `SELECT b.*, c.title AS course_title FROM course_batches b
       JOIN courses c ON c.id = b.course_id WHERE b.id = $1`,
      [req.params.id]
    );
    if (!batchRes.rows.length) return res.status(404).json({ error: 'Batch not found' });
    const batch = batchRes.rows[0];

    if (!batch.live_url) {
      return res.status(400).json({ error: 'حط رابط Zoom للدفعة الأول' });
    }

    const studentsRes = await query(
      `SELECT u.email, u.name FROM enrollments e
       JOIN users u ON u.id = e.user_id
       WHERE e.batch_id = $1 AND e.is_active = true`,
      [req.params.id]
    );

    const meeting = {
      topic: topic || `${batch.course_title} — ${batch.name}`,
      start_time: new Date(),
      duration: 60,
      join_url: batch.live_url,
    };

    let sent = 0;
    for (const s of studentsRes.rows) {
      try {
        await emailService.sendNewLiveSessionEmail(s, meeting);
        // Also create an in-app notification
        await query(
          `INSERT INTO notifications (user_id, message, type)
           SELECT id, $1, 'success' FROM users WHERE email = $2`,
          [`🔴 المحاضرة بدأت: ${meeting.topic}`, s.email]
        );
        sent++;
      } catch (e) { console.warn('Email failed for', s.email, e.message); }
    }

    res.json({ message: 'Notifications sent', recipients: sent });
  } catch (err) { next(err); }
};

// ─── GET /api/batches/:id/assignments  ──────────────────
//   Returns all assignments (from this batch's course) + my submission state.
const batchAssignments = async (req, res, next) => {
  try {
    const isAdmin = req.user.role === 'admin';
    if (!isAdmin) {
      const ok = await query(
        `SELECT 1 FROM enrollments WHERE user_id = $1 AND batch_id = $2 AND is_active = true`,
        [req.user.user_id, req.params.id]
      );
      if (!ok.rows.length) return res.status(403).json({ error: 'Not in this batch' });
    }
    const result = await query(
      `SELECT a.id, a.title, a.description, a.due_days, a.created_at,
              l.id AS lesson_id, l.title AS lesson_title,
              s.title AS section_title,
              sub.id AS submission_id, sub.file_key AS submission_file,
              sub.notes AS submission_notes, sub.grade, sub.feedback,
              sub.submitted_at,
              (SELECT COUNT(*) FROM assignment_submissions WHERE assignment_id = a.id)::int AS total_submissions
       FROM assignments a
       JOIN lessons l ON l.id = a.lesson_id
       JOIN sections s ON s.id = l.section_id
       JOIN course_batches b ON b.course_id = s.course_id
       LEFT JOIN assignment_submissions sub
         ON sub.assignment_id = a.id AND sub.user_id = $1
       WHERE b.id = $2
       ORDER BY a.created_at`,
      [req.user.user_id, req.params.id]
    );
    res.json(result.rows);
  } catch (err) { next(err); }
};

// ─── GET /api/batches/:id/submissions-overview  (admin) ──
//   Matrix view: every student × every assignment + status/grade.
const submissionsOverview = async (req, res, next) => {
  try {
    // All students in this batch
    const studentsRes = await query(
      `SELECT u.id, u.name, u.email FROM enrollments e
       JOIN users u ON u.id = e.user_id
       WHERE e.batch_id = $1 AND e.is_active = true
       ORDER BY u.name`,
      [req.params.id]
    );
    // All assignments in the course
    const assignRes = await query(
      `SELECT a.id, a.title FROM assignments a
       JOIN lessons l ON l.id = a.lesson_id
       JOIN sections s ON s.id = l.section_id
       JOIN course_batches b ON b.course_id = s.course_id
       WHERE b.id = $1 ORDER BY a.created_at`,
      [req.params.id]
    );
    const studentIds = studentsRes.rows.map((s) => s.id);
    const assignIds  = assignRes.rows.map((a) => a.id);
    let submissions = [];
    if (studentIds.length && assignIds.length) {
      const subRes = await query(
        `SELECT * FROM assignment_submissions
         WHERE user_id = ANY($1::uuid[]) AND assignment_id = ANY($2::uuid[])`,
        [studentIds, assignIds]
      );
      submissions = subRes.rows;
    }
    res.json({
      students: studentsRes.rows,
      assignments: assignRes.rows,
      submissions,
    });
  } catch (err) { next(err); }
};

// ─── GET /api/batches/:id/leaderboard  ──────────────────
//   Top performers in the batch by average grade (only graded submissions).
const leaderboard = async (req, res, next) => {
  try {
    const result = await query(
      `WITH batch_assignments AS (
         SELECT a.id FROM assignments a
         JOIN lessons l ON l.id = a.lesson_id
         JOIN sections sec ON sec.id = l.section_id
         JOIN course_batches b ON b.course_id = sec.course_id
         WHERE b.id = $1
       )
       SELECT u.id, u.name, u.email,
              ROUND(AVG(s.grade)::numeric, 1) AS avg_grade,
              COUNT(s.id) FILTER (WHERE s.grade IS NOT NULL)::int AS graded_count,
              COUNT(s.id)::int AS total_submitted
       FROM enrollments e
       JOIN users u ON u.id = e.user_id
       LEFT JOIN assignment_submissions s ON s.user_id = u.id
         AND s.assignment_id IN (SELECT id FROM batch_assignments)
       WHERE e.batch_id = $1 AND e.is_active = true
       GROUP BY u.id, u.name, u.email
       ORDER BY avg_grade DESC NULLS LAST, graded_count DESC
       LIMIT 100`,
      [req.params.id]
    );
    res.json(result.rows);
  } catch (err) { next(err); }
};

// ─── Attendance ─────────────────────────────────────────
// GET /api/batches/:id/recordings/:recId/attendance  (admin)
const getAttendance = async (req, res, next) => {
  try {
    const result = await query(
      `SELECT u.id AS user_id, u.name, u.email,
              a.id AS attendance_id, a.attended, a.notes
       FROM enrollments e
       JOIN users u ON u.id = e.user_id
       LEFT JOIN session_attendance a
         ON a.recording_id = $2 AND a.user_id = u.id
       WHERE e.batch_id = $1 AND e.is_active = true
       ORDER BY u.name`,
      [req.params.id, req.params.recId]
    );
    res.json(result.rows);
  } catch (err) { next(err); }
};

// POST /api/batches/:id/recordings/:recId/attendance  (admin)
//   Body: { records: [{ user_id, attended, notes }] }
const setAttendance = async (req, res, next) => {
  try {
    const { records } = req.body;
    if (!Array.isArray(records)) return res.status(400).json({ error: 'records[] required' });
    for (const r of records) {
      await query(
        `INSERT INTO session_attendance (recording_id, user_id, attended, notes)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (recording_id, user_id) DO UPDATE SET attended = EXCLUDED.attended, notes = EXCLUDED.notes`,
        [req.params.recId, r.user_id, r.attended ?? true, r.notes || null]
      );
    }
    res.json({ message: 'Saved', count: records.length });
  } catch (err) { next(err); }
};

// GET /api/batches/:id/attendance-summary  (admin)
//   Per-student attendance count across all sessions in this batch.
const attendanceSummary = async (req, res, next) => {
  try {
    const result = await query(
      `SELECT u.id, u.name, u.email,
              COUNT(r.id)::int AS total_sessions,
              COUNT(a.id) FILTER (WHERE a.attended = true)::int AS attended_count
       FROM enrollments e
       JOIN users u ON u.id = e.user_id
       LEFT JOIN batch_recordings r ON r.batch_id = e.batch_id
       LEFT JOIN session_attendance a ON a.recording_id = r.id AND a.user_id = u.id
       WHERE e.batch_id = $1 AND e.is_active = true
       GROUP BY u.id, u.name, u.email
       ORDER BY attended_count DESC, u.name`,
      [req.params.id]
    );
    res.json(result.rows);
  } catch (err) { next(err); }
};

// GET /api/batches/:id/my-attendance  (student)
const myAttendance = async (req, res, next) => {
  try {
    const result = await query(
      `SELECT r.id, r.title, r.recorded_at,
              a.attended, a.notes
       FROM batch_recordings r
       LEFT JOIN session_attendance a ON a.recording_id = r.id AND a.user_id = $1
       WHERE r.batch_id = $2
       ORDER BY r.recorded_at DESC NULLS LAST`,
      [req.user.user_id, req.params.id]
    );
    res.json(result.rows);
  } catch (err) { next(err); }
};

// ─── Feedback ───────────────────────────────────────────
// POST /api/batches/:id/feedback  (student)  — submit own feedback
const submitFeedback = async (req, res, next) => {
  try {
    const { kind, rating, expectations, highlights, improvements, recommend } = req.body;
    if (!['first', 'last'].includes(kind)) return res.status(400).json({ error: 'kind must be first|last' });

    const ok = await query(
      `SELECT 1 FROM enrollments WHERE user_id = $1 AND batch_id = $2 AND is_active = true`,
      [req.user.user_id, req.params.id]
    );
    if (!ok.rows.length) return res.status(403).json({ error: 'Not in this batch' });

    const result = await query(
      `INSERT INTO batch_feedback (batch_id, user_id, kind, rating, expectations, highlights, improvements, recommend)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       ON CONFLICT (batch_id, user_id, kind) DO UPDATE
         SET rating = EXCLUDED.rating, expectations = EXCLUDED.expectations,
             highlights = EXCLUDED.highlights, improvements = EXCLUDED.improvements,
             recommend = EXCLUDED.recommend, created_at = NOW()
       RETURNING *`,
      [req.params.id, req.user.user_id, kind, rating || null, expectations || null, highlights || null, improvements || null, recommend ?? null]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) { next(err); }
};

// GET /api/batches/:id/my-feedback  (student)
const myFeedback = async (req, res, next) => {
  try {
    const result = await query(
      `SELECT * FROM batch_feedback WHERE batch_id = $1 AND user_id = $2`,
      [req.params.id, req.user.user_id]
    );
    res.json(result.rows);
  } catch (err) { next(err); }
};

// GET /api/batches/:id/feedback  (admin)
const getAllFeedback = async (req, res, next) => {
  try {
    const result = await query(
      `SELECT f.*, u.name, u.email FROM batch_feedback f
       JOIN users u ON u.id = f.user_id
       WHERE f.batch_id = $1
       ORDER BY f.kind, f.created_at DESC`,
      [req.params.id]
    );
    res.json(result.rows);
  } catch (err) { next(err); }
};

module.exports = {
  listBatchesForCourse, createBatch, updateBatch, deleteBatch,
  getBatchStudents, enrollInBatch, removeFromBatch, myBatches,
  listRecordings, addRecording, deleteRecording,
  getMessages, postMessage, deleteMessage,
  notifySession,
  batchAssignments, submissionsOverview, leaderboard,
  getAttendance, setAttendance, attendanceSummary, myAttendance,
  submitFeedback, myFeedback, getAllFeedback,
};
