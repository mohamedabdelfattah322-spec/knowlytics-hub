const router = require('express').Router();
const { authenticate, authorize } = require('../middleware/auth');
const {
  startVideoSession, updateVideoSession, logVideoEvent, logVideoEventsBatch,
  logCartEvent, logPageView,
  getOverview, getUserAnalytics, getCourseAnalytics, getRealtime,
} = require('../controllers/analyticsController');

// ─── Student tracking (authenticated) ────────────
router.post('/video/session',        authenticate, startVideoSession);
router.put('/video/session/:id',     authenticate, updateVideoSession);
router.post('/video/event',          authenticate, logVideoEvent);
router.post('/video/events-batch',   authenticate, logVideoEventsBatch);
router.post('/cart-event',           authenticate, logCartEvent);
router.post('/page-view',            authenticate, logPageView);

// ─── Admin analytics (admin only) ────────────────
router.get('/overview',              authenticate, authorize('admin'), getOverview);
router.get('/realtime',              authenticate, authorize('admin'), getRealtime);
router.get('/user/:userId',          authenticate, authorize('admin'), getUserAnalytics);
router.get('/course/:courseId',       authenticate, authorize('admin'), getCourseAnalytics);

module.exports = router;
