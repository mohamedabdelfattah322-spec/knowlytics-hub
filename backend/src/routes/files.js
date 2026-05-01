const router = require('express').Router();
const path = require('path');
const { authenticate, authorize } = require('../middleware/auth');
const {
  upload, uploadFile, uploadVideoToLesson,
  downloadFile, streamVideo, listCourseFiles, deleteFile,
} = require('../controllers/fileController');

// Upload a general file (PDF, Excel, image…) attached to a course/lesson
router.post('/upload', authenticate, authorize('admin'), upload.single('file'), uploadFile);

// Upload a video and directly link it to a lesson
router.post('/upload-video', authenticate, authorize('admin'), upload.single('file'), uploadVideoToLesson);

// Stream local video with HTTP Range support
router.get('/stream/*', authenticate, streamVideo);

// Secure download (returns signed S3 URL or triggers local download)
router.get('/:id/download', authenticate, downloadFile);

// List all files attached to a course
router.get('/course/:courseId', authenticate, listCourseFiles);

router.delete('/:id', authenticate, authorize('admin'), deleteFile);

module.exports = router;
