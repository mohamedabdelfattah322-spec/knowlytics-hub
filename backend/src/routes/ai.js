const router = require('express').Router();
const { authenticate, authorize } = require('../middleware/auth');
const { generateQuiz, saveGeneratedQuiz, chat, summarize } = require('../controllers/aiController');

// ─── Student ──────────────────────────────────
router.post('/chat',          authenticate, chat);
router.post('/summarize',     authenticate, summarize);

// ─── Admin ────────────────────────────────────
router.post('/generate-quiz',      authenticate, authorize('admin'), generateQuiz);
router.post('/save-generated-quiz', authenticate, authorize('admin'), saveGeneratedQuiz);

module.exports = router;
