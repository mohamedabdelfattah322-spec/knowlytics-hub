const router = require('express').Router();
const { authenticate, authorize } = require('../middleware/auth');
const {
  getThreads, getThread, createThread, updateThread, deleteThread,
  pinThread, resolveThread,
  createReply, updateReply, deleteReply, markAsAnswer,
  vote,
} = require('../controllers/discussionController');

// ─── Threads ──────────────────────────────────
router.get('/course/:courseId',    authenticate, getThreads);
router.post('/course/:courseId',   authenticate, createThread);
router.get('/thread/:id',         authenticate, getThread);
router.put('/thread/:id',         authenticate, updateThread);
router.delete('/thread/:id',      authenticate, deleteThread);
router.put('/thread/:id/pin',     authenticate, authorize('admin'), pinThread);
router.put('/thread/:id/resolve', authenticate, resolveThread);

// ─── Replies ──────────────────────────────────
router.post('/thread/:id/reply',     authenticate, createReply);
router.put('/reply/:id',            authenticate, updateReply);
router.delete('/reply/:id',         authenticate, deleteReply);
router.put('/reply/:id/answer',     authenticate, authorize('admin'), markAsAnswer);

// ─── Votes ────────────────────────────────────
router.post('/vote', authenticate, vote);

module.exports = router;
