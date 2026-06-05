const multer = require('multer');
const multerS3 = require('multer-s3');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const { query } = require('../config/database');

// ─── Detect storage mode ─────────────────────────────────
// Falls back to local disk when AWS credentials are not configured
const USE_S3 = !!(
  process.env.AWS_ACCESS_KEY_ID &&
  process.env.AWS_ACCESS_KEY_ID !== 'REPLACE_WITH_YOUR_KEY' &&
  process.env.AWS_SECRET_ACCESS_KEY &&
  process.env.AWS_SECRET_ACCESS_KEY !== 'REPLACE_WITH_YOUR_SECRET'
);

console.log(`[Storage] Mode: ${USE_S3 ? 'AWS S3' : 'Local disk (uploads/)'}`);

const UPLOAD_DIR = path.join(__dirname, '../../uploads');

// ─── Local disk storage ───────────────────────────────────
const diskStorage = multer.diskStorage({
  destination: (_req, file, cb) => {
    const folder = file.mimetype.startsWith('video/') ? 'videos' : 'files';
    const dest = path.join(UPLOAD_DIR, folder);
    fs.mkdirSync(dest, { recursive: true });
    cb(null, dest);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${uuidv4()}${ext}`);
  },
});

// ─── S3 storage ───────────────────────────────────────────
let s3Storage = null;
if (USE_S3) {
  const { s3Client, BUCKET } = require('../config/aws');
  s3Storage = multerS3({
    s3: s3Client,
    bucket: BUCKET,
    contentType: multerS3.AUTO_CONTENT_TYPE,
    key: (_req, file, cb) => {
      const ext = path.extname(file.originalname);
      const folder = file.mimetype.startsWith('video/') ? 'videos' : 'files';
      cb(null, `${folder}/${uuidv4()}${ext}`);
    },
  });
}

const ALLOWED_TYPES = [
  'video/mp4', 'video/webm', 'video/quicktime', 'video/x-msvideo',
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/msword',
  'image/jpeg', 'image/png', 'image/webp', 'image/gif',
];

const upload = multer({
  storage: USE_S3 ? s3Storage : diskStorage,
  limits: { fileSize: 2 * 1024 * 1024 * 1024 }, // 2 GB
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_TYPES.includes(file.mimetype)) return cb(null, true);
    cb(new Error(`نوع الملف غير مدعوم: ${file.mimetype}`));
  },
});

// Resolve the storage key/path from the multer file object
const getFileKey = (file) => {
  if (USE_S3) return file.key; // multer-s3 sets file.key
  // Local: store relative path  e.g.  videos/abc.mp4
  const folder = file.mimetype.startsWith('video/') ? 'videos' : 'files';
  return `${folder}/${file.filename}`;
};

// ─── POST /api/files/upload ───────────────────────────────
const uploadFile = async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'لم يتم إرسال ملف' });

    const { course_id, lesson_id, title } = req.body;
    const file = req.file;
    const fileKey = getFileKey(file);

    const result = await query(
      `INSERT INTO course_files (course_id, lesson_id, name, file_key, file_type, file_size)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [
        course_id || null,
        lesson_id || null,
        title || file.originalname,
        fileKey,
        file.mimetype,
        file.size,
      ]
    );

    res.status(201).json({ file: result.rows[0], storage: USE_S3 ? 's3' : 'local' });
  } catch (err) {
    next(err);
  }
};

// ─── POST /api/files/upload-video-to-lesson ───────────────
// Uploads a video → saves locally → uploads to Bunny → deletes local file
const uploadVideoToLesson = async (req, res, next) => {
  const localFilePath = req.file ? path.join(UPLOAD_DIR, getFileKey(req.file)) : null;
  try {
    if (!req.file) return res.status(400).json({ error: 'لم يتم إرسال فيديو' });
    const { lesson_id } = req.body;
    if (!lesson_id) return res.status(400).json({ error: 'lesson_id مطلوب' });

    const fileKey = getFileKey(req.file);

    // Get lesson title for Bunny
    const lessonRes = await query('SELECT id, title FROM lessons WHERE id = $1', [lesson_id]);
    if (!lessonRes.rows.length) return res.status(404).json({ error: 'الدرس غير موجود' });
    const lessonTitle = lessonRes.rows[0].title;

    // Try to upload to Bunny if configured
    const bunnyService = require('../services/bunnyService');
    const hasBunny = !!(process.env.BUNNY_LIBRARY_ID && process.env.BUNNY_API_KEY);

    let bunnyVideoId = null;
    let bunnyEmbedUrl = null;
    let durationMinutes = null;

    if (hasBunny) {
      // Upload to Bunny
      const bunnyData = await bunnyService.uploadVideoToBunny(localFilePath, lessonTitle);
      bunnyVideoId = bunnyData.videoId;
      bunnyEmbedUrl = bunnyService.getEmbedUrl(bunnyData.videoId);

      // Get duration from Bunny
      const durationSeconds = await bunnyService.getVideoDuration(bunnyData.videoId);
      durationMinutes = durationSeconds ? Math.ceil(durationSeconds / 60) : null;

      // Delete local file (no longer needed)
      try {
        fs.unlinkSync(localFilePath);
        console.log(`[Bunny] Deleted local file: ${fileKey}`);
      } catch (e) {
        console.warn(`[Bunny] Could not delete local file: ${e.message}`);
      }
    }

    // Update lesson
    const result = await query(
      `UPDATE lessons
       SET video_key = $1, bunny_video_id = $2, bunny_embed_url = $3,
           duration_minutes = COALESCE($4, duration_minutes), updated_at = NOW()
       WHERE id = $5
       RETURNING id, title, video_key, bunny_video_id, bunny_embed_url, duration_minutes`,
      [hasBunny ? null : fileKey, bunnyVideoId, bunnyEmbedUrl, durationMinutes, lesson_id]
    );

    // Recalculate course total duration
    if (durationMinutes) {
      const courseRes = await query(
        `SELECT s.course_id FROM lessons l JOIN sections s ON s.id = l.section_id WHERE l.id = $1`,
        [lesson_id]
      );
      if (courseRes.rows.length) {
        await query(
          `UPDATE courses SET duration_hours = ROUND(
            (SELECT COALESCE(SUM(l.duration_minutes), 0)
             FROM lessons l JOIN sections s ON s.id = l.section_id
             WHERE s.course_id = $1) / 60.0, 1)
           WHERE id = $1`,
          [courseRes.rows[0].course_id]
        );
      }
    }

    res.json({
      lesson: result.rows[0],
      storage: hasBunny ? 'bunny' : (USE_S3 ? 's3' : 'local'),
      duration_minutes: durationMinutes,
      message: hasBunny
        ? `✅ تم رفع الفيديو إلى Bunny${durationMinutes ? ` — المدة: ${durationMinutes} دقيقة` : ''}`
        : '✅ تم رفع الفيديو',
    });
  } catch (err) {
    // Clean up local file on error
    if (localFilePath && fs.existsSync(localFilePath)) {
      try { fs.unlinkSync(localFilePath); } catch (e) {}
    }
    next(err);
  }
};

// ─── POST /api/files/upload-to-bunny ────────────────────
// Upload a local video file to Bunny.net and link it to lesson
const uploadVideoToBunny = async (req, res, next) => {
  try {
    const { lesson_id } = req.body;
    if (!lesson_id) return res.status(400).json({ error: 'lesson_id مطلوب' });

    // Get the lesson to find its current video
    const lessonRes = await query('SELECT id, title, video_key FROM lessons WHERE id = $1', [lesson_id]);
    if (!lessonRes.rows.length) return res.status(404).json({ error: 'الدرس غير موجود' });

    const lesson = lessonRes.rows[0];
    if (!lesson.video_key) return res.status(400).json({ error: 'لا يوجد فيديو محفوظ للدرس' });

    // Get the local file path
    const UPLOAD_DIR = path.join(__dirname, '../../uploads');
    const filePath = path.join(UPLOAD_DIR, lesson.video_key);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'الملف المحلي غير موجود' });
    }

    // Upload to Bunny
    const bunnyService = require('../services/bunnyService');
    const bunnyData = await bunnyService.uploadVideoToBunny(filePath, lesson.title);
    const embedUrl = bunnyService.getEmbedUrl(bunnyData.videoId);

    // Get video duration from Bunny (wait for processing)
    const durationSeconds = await bunnyService.getVideoDuration(bunnyData.videoId);
    const durationMinutes = durationSeconds ? Math.ceil(durationSeconds / 60) : null;

    // Update lesson with Bunny info + duration
    const updateRes = await query(
      `UPDATE lessons
       SET bunny_video_id = $1, bunny_embed_url = $2,
           duration_minutes = COALESCE($3, duration_minutes),
           updated_at = NOW()
       WHERE id = $4 RETURNING id, bunny_video_id, bunny_embed_url, duration_minutes`,
      [bunnyData.videoId, embedUrl, durationMinutes, lesson_id]
    );

    // Recalculate course total duration from all lessons
    const courseRes = await query(
      `SELECT s.course_id FROM lessons l
       JOIN sections s ON s.id = l.section_id
       WHERE l.id = $1`,
      [lesson_id]
    );

    if (courseRes.rows.length) {
      const courseId = courseRes.rows[0].course_id;
      await query(
        `UPDATE courses
         SET duration_hours = ROUND(
           (SELECT COALESCE(SUM(l.duration_minutes), 0)
            FROM lessons l
            JOIN sections s ON s.id = l.section_id
            WHERE s.course_id = $1) / 60.0, 1
         )
         WHERE id = $1`,
        [courseId]
      );
      console.log(`[Auto] Updated course ${courseId} duration`);
    }

    res.json({
      lesson: updateRes.rows[0],
      bunny: bunnyData,
      duration_minutes: durationMinutes,
      message: `✅ تم رفع الفيديو إلى Bunny${durationMinutes ? ` — المدة: ${durationMinutes} دقيقة` : ''}`
    });
  } catch (err) {
    console.error('[Bunny Upload Error]', err);
    next(err);
  }
};

// ─── GET /api/files/:id/download ─────────────────────────
const downloadFile = async (req, res, next) => {
  try {
    const fileResult = await query('SELECT * FROM course_files WHERE id = $1', [req.params.id]);
    if (!fileResult.rows.length) return res.status(404).json({ error: 'الملف غير موجود' });

    const file = fileResult.rows[0];

    // Check enrollment
    if (req.user.role !== 'admin' && file.course_id) {
      const enroll = await query(
        `SELECT id FROM enrollments WHERE user_id = $1 AND course_id = $2 AND is_active = true`,
        [req.user.user_id, file.course_id]
      );
      if (!enroll.rows.length) return res.status(403).json({ error: 'غير مسجّل في الكورس' });
    }

    if (USE_S3) {
      const { getSignedVideoUrl } = require('../config/aws');
      const url = await getSignedVideoUrl(file.file_key, 300);
      return res.json({ url, filename: file.name, storage: 's3' });
    }

    // Local: serve directly
    const localPath = path.join(UPLOAD_DIR, file.file_key);
    if (!fs.existsSync(localPath)) return res.status(404).json({ error: 'الملف غير موجود على الخادم' });
    res.download(localPath, file.name);
  } catch (err) {
    next(err);
  }
};

// ─── GET /api/files/stream/:fileKey(*) ───────────────────
// Streams a local video with range support (for <video> tags)
const streamVideo = async (req, res, next) => {
  try {
    const fileKey = req.params.fileKey;

    // Security: block path traversal (encoded & raw) and absolute paths
    const decoded = decodeURIComponent(fileKey);
    if (decoded.includes('..') || fileKey.includes('..') || path.isAbsolute(fileKey) || /[<>"|?*]/.test(fileKey)) {
      return res.status(400).json({ error: 'Invalid path' });
    }

    const localPath = path.join(UPLOAD_DIR, fileKey);
    if (!fs.existsSync(localPath)) return res.status(404).json({ error: 'الفيديو غير موجود' });

    const stat = fs.statSync(localPath);
    const fileSize = stat.size;
    const range = req.headers.range;

    if (range) {
      // Partial content for video seeking
      const parts = range.replace(/bytes=/, '').split('-');
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
      const chunkSize = end - start + 1;

      res.writeHead(206, {
        'Content-Range': `bytes ${start}-${end}/${fileSize}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunkSize,
        'Content-Type': 'video/mp4',
      });
      fs.createReadStream(localPath, { start, end }).pipe(res);
    } else {
      res.writeHead(200, {
        'Content-Length': fileSize,
        'Content-Type': 'video/mp4',
      });
      fs.createReadStream(localPath).pipe(res);
    }
  } catch (err) {
    next(err);
  }
};

// ─── GET /api/files/course/:courseId ─────────────────────
const listCourseFiles = async (req, res, next) => {
  try {
    const result = await query(
      `SELECT id, name, file_type, file_size, lesson_id, created_at
       FROM course_files WHERE course_id = $1 ORDER BY created_at DESC`,
      [req.params.courseId]
    );
    res.json(result.rows);
  } catch (err) {
    next(err);
  }
};

// ─── DELETE /api/files/:id ────────────────────────────────
const deleteFile = async (req, res, next) => {
  try {
    const fileResult = await query('SELECT * FROM course_files WHERE id = $1', [req.params.id]);
    if (!fileResult.rows.length) return res.status(404).json({ error: 'الملف غير موجود' });

    const file = fileResult.rows[0];

    if (USE_S3) {
      const { deleteObject } = require('../config/aws');
      await deleteObject(file.file_key).catch(() => {});
    } else {
      const localPath = path.join(UPLOAD_DIR, file.file_key);
      if (fs.existsSync(localPath)) fs.unlinkSync(localPath);
    }

    await query('DELETE FROM course_files WHERE id = $1', [req.params.id]);
    res.json({ message: 'تم حذف الملف' });
  } catch (err) {
    next(err);
  }
};

module.exports = { upload, uploadFile, uploadVideoToLesson, uploadVideoToBunny, downloadFile, streamVideo, listCourseFiles, deleteFile, USE_S3 };
