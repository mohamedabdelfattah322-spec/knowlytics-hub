const router = require('express').Router();
const { authenticate, authorize } = require('../middleware/auth');
const { ipGuard } = require('../middleware/sessionGuard');
const { getLesson, createLesson, updateLesson, deleteLesson, completeLesson } = require('../controllers/lessonController');

router.get('/:id', authenticate, ipGuard, getLesson);
router.post('/', authenticate, authorize('admin'), createLesson);
router.put('/:id', authenticate, authorize('admin'), updateLesson);
router.delete('/:id', authenticate, authorize('admin'), deleteLesson);
router.post('/:id/complete', authenticate, completeLesson);

module.exports = router;
