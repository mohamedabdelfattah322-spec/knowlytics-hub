const router = require('express').Router();
const { authenticate, authorize } = require('../middleware/auth');
const { getQuiz, submitQuiz, createQuiz, getResults, getQuizzesByCourse, deleteQuiz, getCourseLeaderboard } = require('../controllers/quizController');

router.get('/course/:courseId/leaderboard', authenticate, authorize('admin'), getCourseLeaderboard);
router.get('/course/:courseId', authenticate, getQuizzesByCourse);
router.get('/:id', authenticate, getQuiz);
router.get('/:id/results', authenticate, getResults);
router.post('/', authenticate, authorize('admin'), createQuiz);
router.post('/:id/submit', authenticate, submitQuiz);
router.delete('/:id', authenticate, authorize('admin'), deleteQuiz);

module.exports = router;
