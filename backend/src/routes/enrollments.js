const router = require('express').Router();
const { authenticate, authorize } = require('../middleware/auth');
const { enroll, myEnrollments, getCourseEnrollments, removeEnrollment } = require('../controllers/enrollmentController');

router.post('/', authenticate, enroll);
router.get('/my', authenticate, myEnrollments);
router.get('/course/:courseId', authenticate, authorize('admin'), getCourseEnrollments);
router.delete('/:id', authenticate, authorize('admin'), removeEnrollment);

module.exports = router;
