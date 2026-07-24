const router = require('express').Router();
const { authenticate, authorize } = require('../middleware/auth');
const c = require('../controllers/batchController');

const adminOnly = [authenticate, authorize('admin')];

// Student
router.get('/my', authenticate, c.myBatches);

// Chat — accessible to enrolled students AND admins
router.get('/:id/messages', authenticate, c.getMessages);
router.post('/:id/messages', authenticate, c.postMessage);
router.delete('/:id/messages/:messageId', authenticate, c.deleteMessage);

// Recordings — admins read+write, students read-only (controller checks enrollment)
router.get('/:id/recordings', authenticate, c.listRecordings);
router.post('/:id/recordings', ...adminOnly, c.addRecording);
router.delete('/:id/recordings/:recordingId', ...adminOnly, c.deleteRecording);

// Admin: manage batches and students
router.get('/course/:courseId', ...adminOnly, c.listBatchesForCourse);
router.post('/', ...adminOnly, c.createBatch);
router.patch('/:id', ...adminOnly, c.updateBatch);
router.delete('/:id', ...adminOnly, c.deleteBatch);
router.get('/:id/students', ...adminOnly, c.getBatchStudents);
router.post('/:id/enroll', ...adminOnly, c.enrollInBatch);
router.delete('/:id/students/:userId', ...adminOnly, c.removeFromBatch);
router.post('/:id/notify', ...adminOnly, c.notifySession);

// Assignments + leaderboard (auth required, controller checks batch membership)
router.get('/:id/assignments', authenticate, c.batchAssignments);
router.get('/:id/leaderboard', authenticate, c.leaderboard);
router.get('/:id/submissions-overview', ...adminOnly, c.submissionsOverview);

// Attendance
router.get('/:id/recordings/:recId/attendance', ...adminOnly, c.getAttendance);
router.post('/:id/recordings/:recId/attendance', ...adminOnly, c.setAttendance);
router.get('/:id/attendance-summary', ...adminOnly, c.attendanceSummary);
router.get('/:id/my-attendance', authenticate, c.myAttendance);

// Feedback
router.post('/:id/feedback', authenticate, c.submitFeedback);
router.get('/:id/my-feedback', authenticate, c.myFeedback);
router.get('/:id/feedback', ...adminOnly, c.getAllFeedback);

module.exports = router;
