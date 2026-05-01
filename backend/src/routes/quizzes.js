const router = require('express').Router();
const { authenticate, authorize } = require('../middleware/auth');
const { getQuiz, submitQuiz, createQuiz, getResults } = require('../controllers/quizController');

router.get('/:id', authenticate, getQuiz);
router.post('/:id/submit', authenticate, submitQuiz);
router.post('/', authenticate, authorize('admin'), createQuiz);
router.get('/:id/results', authenticate, getResults);

module.exports = router;
