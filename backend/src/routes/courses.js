const router = require('express').Router();
const { authenticate, authorize } = require('../middleware/auth');
const { ipGuard } = require('../middleware/sessionGuard');
const { listCourses, getCourse, createCourse, updateCourse, deleteCourse, getCourseAnalytics,
        submitCourseFeedback, myCourseFeedback, allCourseFeedback, finalQuizStatus,
        courseFeedbackSummary } = require('../controllers/courseController');

router.get('/', listCourses);
router.get('/:id', getCourse);
router.post('/', authenticate, authorize('admin'), createCourse);
router.put('/:id', authenticate, authorize('admin'), updateCourse);
router.delete('/:id', authenticate, authorize('admin'), deleteCourse);
router.get('/:id/analytics', authenticate, authorize('admin'), getCourseAnalytics);

// Course-level feedback
router.post('/:id/feedback', authenticate, submitCourseFeedback);
router.get('/:id/my-feedback', authenticate, myCourseFeedback);
router.get('/:id/feedback-summary', courseFeedbackSummary);
router.get('/:id/feedback', authenticate, authorize('admin'), allCourseFeedback);

// Final quiz status for the user
router.get('/:id/final-quiz-status', authenticate, finalQuizStatus);

// Completed lesson IDs for progress sidebar
router.get('/:id/my-progress', authenticate, async (req, res, next) => {
  try {
    const { query: dbQuery } = require('../config/database');
    const result = await dbQuery(
      `SELECT l.id AS lesson_id
       FROM lesson_progress lp
       JOIN lessons l ON l.id = lp.lesson_id
       JOIN sections s ON s.id = l.section_id
       WHERE s.course_id = $1 AND lp.user_id = $2 AND lp.completed = true`,
      [req.params.id, req.user.user_id]
    );
    res.json({ completed_ids: result.rows.map(r => r.lesson_id) });
  } catch (err) { next(err); }
});

module.exports = router;
