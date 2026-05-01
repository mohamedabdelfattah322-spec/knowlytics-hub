const router = require('express').Router();
const { authenticate, authorize } = require('../middleware/auth');
const { ipGuard } = require('../middleware/sessionGuard');
const { listCourses, getCourse, createCourse, updateCourse, deleteCourse, getCourseAnalytics } = require('../controllers/courseController');

router.get('/', listCourses);
router.get('/:id', getCourse);
router.post('/', authenticate, authorize('admin'), createCourse);
router.put('/:id', authenticate, authorize('admin'), updateCourse);
router.delete('/:id', authenticate, authorize('admin'), deleteCourse);
router.get('/:id/analytics', authenticate, authorize('admin'), getCourseAnalytics);

module.exports = router;
