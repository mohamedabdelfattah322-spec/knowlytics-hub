const router = require('express').Router();
const path = require('path');
const { authenticate, authorize } = require('../middleware/auth');
const {
  upload, uploadFile, uploadVideoToLesson, uploadVideoToBunny,
  getBunnyTusToken, bunnyTusComplete, getBunnyTusTokenPromo, setBunnyThumbnail,
  refreshLessonDuration, downloadFile, streamVideo, listCourseFiles, deleteFile,
} = require('../controllers/fileController');

// Upload a general file (PDF, Excel, image…) attached to a course/lesson
router.post('/upload', authenticate, authorize('admin'), upload.single('file'), uploadFile);

// Upload a video and directly link it to a lesson
router.post('/upload-video', authenticate, authorize('admin'), upload.single('file'), uploadVideoToLesson);

// Upload local video to Bunny.net
router.post('/upload-to-bunny', authenticate, authorize('admin'), uploadVideoToBunny);

// Direct TUS upload to Bunny (browser → Bunny, bypasses this server)
router.post('/bunny-tus-token',       authenticate, authorize('admin'), getBunnyTusToken);
router.post('/bunny-tus-complete',    authenticate, authorize('admin'), bunnyTusComplete);
router.post('/bunny-tus-token-promo', authenticate, authorize('admin'), getBunnyTusTokenPromo);
router.post('/bunny-thumbnail',       authenticate, authorize('admin'), upload.single('thumbnail'), setBunnyThumbnail);
router.post('/refresh-duration',      authenticate, authorize('admin'), refreshLessonDuration);

// Stream local video with HTTP Range support
router.get('/stream/*', authenticate, streamVideo);

// Secure download (returns signed S3 URL or triggers local download)
router.get('/:id/download', authenticate, downloadFile);

// List all files attached to a course
router.get('/course/:courseId', authenticate, listCourseFiles);

router.delete('/:id', authenticate, authorize('admin'), deleteFile);

module.exports = router;
