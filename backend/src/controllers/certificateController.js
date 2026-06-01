const { query } = require('../config/database');
const crypto = require('crypto');

const generateSerial = () => 'KH-' + crypto.randomBytes(4).toString('hex').toUpperCase();

// ─── POST /api/certificates/issue  (student) ────────────
//   Body: { course_id, batch_id? }
//   Eligibility:
//     Live  (with batch): all sessions completed (recordings >= total_sessions)
//     Online: progress_pct = 100  OR  all assignments graded
const issueCertificate = async (req, res, next) => {
  try {
    const { course_id, batch_id } = req.body;
    const userId = req.user.user_id;

    // Must be enrolled
    const enrollRes = await query(
      `SELECT e.*, c.title AS course_title, c.type AS course_type
       FROM enrollments e
       JOIN courses c ON c.id = e.course_id
       WHERE e.user_id = $1 AND e.course_id = $2 AND e.is_active = true`,
      [userId, course_id]
    );
    if (!enrollRes.rows.length) return res.status(403).json({ error: 'مش مسجل في الكورس' });
    const enroll = enrollRes.rows[0];

    // Eligibility check:
    //  1. All lessons completed
    //  2. Final quiz passed (if exists)
    let eligible = false;
    let blockerReason = '';

    // Check if a final quiz exists
    const finalQuizRes = await query(
      `SELECT id, passing_score FROM quizzes WHERE course_id = $1 AND is_final = true LIMIT 1`,
      [course_id]
    );

    if (finalQuizRes.rows.length) {
      const fq = finalQuizRes.rows[0];
      // Best attempt score
      const bestRes = await query(
        `SELECT MAX(score_pct) AS best FROM quiz_attempts WHERE quiz_id = $1 AND user_id = $2`,
        [fq.id, userId]
      );
      const best = bestRes.rows[0]?.best;
      if (best === null || best === undefined) {
        blockerReason = 'لازم تخلص الامتحان النهائي الأول';
      } else if (best < fq.passing_score) {
        blockerReason = `لازم تنجح في الامتحان (${fq.passing_score}%) — أعلى درجة لك ${best}%`;
      } else {
        eligible = true;
      }
    } else if (batch_id) {
      const batchRes = await query(
        `SELECT b.total_sessions,
                (SELECT COUNT(*) FROM batch_recordings WHERE batch_id = b.id)::int AS recordings_count
         FROM course_batches b WHERE b.id = $1`,
        [batch_id]
      );
      if (batchRes.rows.length) {
        const b = batchRes.rows[0];
        eligible = b.recordings_count >= b.total_sessions && b.total_sessions > 0;
        if (!eligible) blockerReason = 'لسه ما اكتملت كل المحاضرات';
      }
    } else {
      eligible = enroll.progress_pct >= 100;
      if (!eligible) blockerReason = 'لسه ما خلصت كل الدروس';
    }

    // Admin can always issue
    if (req.user.role === 'admin') eligible = true;

    if (!eligible) {
      return res.status(400).json({ error: blockerReason || 'لسه ما اكتمل الكورس' });
    }

    // Final grade (avg of graded assignments)
    const gradeRes = await query(
      `SELECT ROUND(AVG(s.grade)::numeric, 1) AS final_grade
       FROM assignment_submissions s
       JOIN assignments a ON a.id = s.assignment_id
       JOIN lessons l ON l.id = a.lesson_id
       JOIN sections sec ON sec.id = l.section_id
       WHERE sec.course_id = $1 AND s.user_id = $2 AND s.grade IS NOT NULL`,
      [course_id, userId]
    );
    const final_grade = gradeRes.rows[0]?.final_grade || null;

    // Insert or fetch existing
    const existing = await query(
      `SELECT * FROM certificates WHERE user_id = $1 AND course_id = $2 AND COALESCE(batch_id::text,'') = COALESCE($3::text,'')`,
      [userId, course_id, batch_id || null]
    );

    let cert;
    if (existing.rows.length) {
      cert = existing.rows[0];
    } else {
      const ins = await query(
        `INSERT INTO certificates (user_id, course_id, batch_id, serial_no, final_grade)
         VALUES ($1, $2, $3, $4, $5) RETURNING *`,
        [userId, course_id, batch_id || null, generateSerial(), final_grade]
      );
      cert = ins.rows[0];
    }

    res.status(201).json(cert);
  } catch (err) { next(err); }
};

// ─── GET /api/certificates/my  (student) ────────────────
const myCertificates = async (req, res, next) => {
  try {
    const result = await query(
      `SELECT cert.*, c.title AS course_title, b.name AS batch_name
       FROM certificates cert
       JOIN courses c ON c.id = cert.course_id
       LEFT JOIN course_batches b ON b.id = cert.batch_id
       WHERE cert.user_id = $1
       ORDER BY cert.issued_at DESC`,
      [req.user.user_id]
    );
    res.json(result.rows);
  } catch (err) { next(err); }
};

// ─── GET /api/certificates/:id  (student or admin) ──────
const getCertificate = async (req, res, next) => {
  try {
    const result = await query(
      `SELECT cert.*, c.title AS course_title, c.duration_hours,
              u.name AS student_name, u.email AS student_email,
              ins.name AS instructor_name,
              b.name AS batch_name, b.end_date AS batch_end_date,
              -- Course completion = max(enrollment.completed_at, last recording date, batch end)
              GREATEST(
                e.completed_at,
                (SELECT MAX(r.recorded_at) FROM batch_recordings r WHERE r.batch_id = cert.batch_id),
                b.end_date::timestamptz
              ) AS course_end_date
       FROM certificates cert
       JOIN courses c ON c.id = cert.course_id
       JOIN users u ON u.id = cert.user_id
       LEFT JOIN users ins ON ins.id = c.instructor_id
       LEFT JOIN course_batches b ON b.id = cert.batch_id
       LEFT JOIN enrollments e ON e.user_id = cert.user_id AND e.course_id = cert.course_id
       WHERE cert.id = $1`,
      [req.params.id]
    );
    if (!result.rows.length) return res.status(404).json({ error: 'Certificate not found' });
    const cert = result.rows[0];
    // Only owner or admin
    if (req.user.role !== 'admin' && cert.user_id !== req.user.user_id) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    res.json(cert);
  } catch (err) { next(err); }
};

// ─── GET /api/certificates/verify/:serial  (public) ─────
const verifyBySerial = async (req, res, next) => {
  try {
    const result = await query(
      `SELECT cert.serial_no, cert.issued_at, cert.final_grade,
              c.title AS course_title, u.name AS student_name,
              ins.name AS instructor_name
       FROM certificates cert
       JOIN courses c ON c.id = cert.course_id
       JOIN users u ON u.id = cert.user_id
       LEFT JOIN users ins ON ins.id = c.instructor_id
       WHERE cert.serial_no = $1`,
      [req.params.serial]
    );
    if (!result.rows.length) return res.status(404).json({ valid: false });
    res.json({ valid: true, ...result.rows[0] });
  } catch (err) { next(err); }
};

module.exports = { issueCertificate, myCertificates, getCertificate, verifyBySerial };
