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

module.exports = router;
