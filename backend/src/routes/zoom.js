const router = require('express').Router();
const { authenticate, authorize } = require('../middleware/auth');
const { createMeeting, listMeetings, zoomWebhook } = require('../controllers/zoomController');

router.post('/meetings', authenticate, authorize('admin'), createMeeting);
router.get('/meetings/course/:courseId', authenticate, listMeetings);
router.post('/webhook', zoomWebhook); // Zoom sends unauthenticated webhooks

module.exports = router;
