const router = require('express').Router();
const { authenticate, authorize } = require('../middleware/auth');
const { getQuiz, submitQuiz, createQuiz, getResults, getQuizzesByCourse, deleteQuiz } = require('../controllers/quizController');

router.get('/course/:courseId', authenticate, authorize('admin'), getQuizzesByCourse);
router.get('/:id', authenticate, getQuiz);
router.get('/:id/results', authenticate, getResults);
router.post('/', authenticate, authorize('admin'), createQuiz);
router.post('/:id/submit', authenticate, submitQuiz);
router.delete('/:id', authenticate, authorize('admin'), deleteQuiz);

module.exports = router;
