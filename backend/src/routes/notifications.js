const router = require('express').Router();
const { authenticate, authorize } = require('../middleware/auth');
const {
  getNotifications, getUnreadCount, markOneRead, markAllRead,
  deleteNotification, sendNotification, broadcastNotification,
} = require('../controllers/notificationController');

// Student
router.get('/',               authenticate, getNotifications);
router.get('/unread-count',   authenticate, getUnreadCount);
router.patch('/:id/read',     authenticate, markOneRead);
router.post('/mark-all-read', authenticate, markAllRead);
router.delete('/:id',         authenticate, deleteNotification);

// Admin
router.post('/send',      authenticate, authorize('admin'), sendNotification);
router.post('/broadcast', authenticate, authorize('admin'), broadcastNotification);

module.exports = router;
