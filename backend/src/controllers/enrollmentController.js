const { query } = require('../config/database');
const emailService = require('../services/emailService');

// POST /api/enrollments
// - Admin: can enroll any student (pass user_id + optional payment_ref)
// - Student: can self-enroll in free courses only
const enroll = async (req, res, next) => {
  try {
    const { course_id, user_id, payment_ref } = req.body;

    const isAdmin = req.user.role === 'admin';
    const targetUserId = isAdmin && user_id ? user_id : req.user.user_id;

    const courseResult = await query('SELECT * FROM courses WHERE id = $1', [course_id]);
    if (!courseResult.rows.length) return res.status(404).json({ error: 'Course not found' });

    const course = courseResult.rows[0];

    // Students can only self-enroll in free courses
    if (!isAdmin) {
      if (parseFloat(course.price) > 0) {
        return res.status(403).json({ error: 'الكورس مدفوع — التسجيل يتم عن طريق الأدمن فقط' });
      }
      if (targetUserId !== req.user.user_id) {
        return res.status(403).json({ error: 'غير مسموح' });
      }
    }

    // Admin enrolling in paid course requires a payment reference
    if (isAdmin && parseFloat(course.price) > 0 && !payment_ref) {
      return res.status(400).json({ error: 'الكورس مدفوع — أدخل رقم مرجع الدفع أولاً' });
    }

    const existing = await query(
      'SELECT id, is_active FROM enrollments WHERE user_id = $1 AND course_id = $2',
      [targetUserId, course_id]
    );

    let result;
    if (existing.rows.length) {
      // Re-activate if previously removed
      result = await query(
        `UPDATE enrollments SET is_active = true, payment_ref = $1, enrolled_at = NOW()
         WHERE user_id = $2 AND course_id = $3 RETURNING *`,
        [payment_ref || null, targetUserId, course_id]
      );
    } else {
      result = await query(
        `INSERT INTO enrollments (user_id, course_id, payment_ref) VALUES ($1, $2, $3) RETURNING *`,
        [targetUserId, course_id, payment_ref || null]
      );
    }

    // Send welcome email
    const userResult = await query('SELECT email, name FROM users WHERE id = $1', [user_id]);
    await emailService.sendEnrollmentConfirmation(userResult.rows[0], course).catch(() => {});

    res.status(201).json(result.rows[0]);
  } catch (err) {
    next(err);
  }
};

// GET /api/enrollments/my  — student's enrollments
const myEnrollments = async (req, res, next) => {
  try {
    const result = await query(
      `SELECT e.*, c.title, c.type, c.thumbnail_url, c.level, c.duration_hours,
              u.name AS instructor_name,
              (SELECT l.id FROM lessons l JOIN sections s ON s.id = l.section_id
               JOIN lesson_progress lp ON lp.lesson_id = l.id
               WHERE s.course_id = c.id AND lp.user_id = e.user_id
               ORDER BY lp.last_accessed DESC LIMIT 1) AS last_lesson_id
       FROM enrollments e
       JOIN courses c ON c.id = e.course_id
       LEFT JOIN users u ON u.id = c.instructor_id
       WHERE e.user_id = $1 AND e.is_active = true
       ORDER BY e.enrolled_at DESC`,
      [req.user.user_id]
    );
    res.json(result.rows);
  } catch (err) {
    next(err);
  }
};

// GET /api/enrollments/course/:courseId  — admin: list all students in a course
const getCourseEnrollments = async (req, res, next) => {
  try {
    const result = await query(
      `SELECT e.*, u.name, u.email, u.student_type
       FROM enrollments e JOIN users u ON u.id = e.user_id
       WHERE e.course_id = $1 ORDER BY e.enrolled_at DESC`,
      [req.params.courseId]
    );
    res.json(result.rows);
  } catch (err) {
    next(err);
  }
};

// DELETE /api/enrollments/:id  — admin: remove enrollment
const removeEnrollment = async (req, res, next) => {
  try {
    await query(`UPDATE enrollments SET is_active = false WHERE id = $1`, [req.params.id]);
    res.json({ message: 'Enrollment removed' });
  } catch (err) {
    next(err);
  }
};

module.exports = { enroll, myEnrollments, getCourseEnrollments, removeEnrollment };
