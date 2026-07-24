const router = require('express').Router();
const { authenticate, authorize } = require('../middleware/auth');
const { ipGuard } = require('../middleware/sessionGuard');
const { getLesson, createLesson, updateLesson, deleteLesson, completeLesson } = require('../controllers/lessonController');
const { listTopics, createTopic, updateTopic, deleteTopic } = require('../controllers/topicController');

router.get('/:id', authenticate, ipGuard, getLesson);
router.post('/', authenticate, authorize('admin'), createLesson);
router.put('/:id', authenticate, authorize('admin'), updateLesson);
router.delete('/:id', authenticate, authorize('admin'), deleteLesson);
router.post('/:id/complete', authenticate, completeLesson);

// Lesson topics (sub-lessons)
router.get('/:lessonId/topics', authenticate, listTopics);
router.post('/:lessonId/topics', authenticate, authorize('admin'), createTopic);
router.put('/:lessonId/topics/:id', authenticate, authorize('admin'), updateTopic);
router.delete('/:lessonId/topics/:id', authenticate, authorize('admin'), deleteTopic);

module.exports = router;
