require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const path = require('path');

const errorHandler = require('./middleware/errorHandler');

// Route imports
const authRoutes = require('./routes/auth');
const courseRoutes = require('./routes/courses');
const lessonRoutes = require('./routes/lessons');
const quizRoutes = require('./routes/quizzes');
const enrollmentRoutes = require('./routes/enrollments');
const userRoutes = require('./routes/users');
const adminRoutes = require('./routes/admin');
const fileRoutes = require('./routes/files');
const notificationRoutes = require('./routes/notifications');
const zoomRoutes = require('./routes/zoom');
const assignmentRoutes = require('./routes/assignments');
const paymentRoutes = require('./routes/payments');
const batchRoutes = require('./routes/batches');
const certificateRoutes = require('./routes/certificates');
const couponRoutes = require('./routes/coupons');
const bundleRoutes = require('./routes/bundles');
const notesRoutes = require('./routes/notes');
const categoryRoutes = require('./routes/categories');
const reviewRoutes = require('./routes/reviews');
const badgeRoutes = require('./routes/badges');
const cartRoutes = require('./routes/cart');
const subscriptionRoutes = require('./routes/subscriptions');
const teamRoutes = require('./routes/teams');
const calendarRoutes = require('./routes/calendar');
const analyticsRoutes = require('./routes/analytics');
const referralRoutes = require('./routes/referrals');
const discussionRoutes = require('./routes/discussions');
const aiRoutes = require('./routes/ai');
const instructorRoutes = require('./routes/instructors');
const { sendBroadcast, getBroadcastHistory } = require('./controllers/broadcastController');

const app = express();

// ─── Security Headers ─────────────────────────────────────
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      mediaSrc: ["'self'", 'blob:', '*.amazonaws.com'],
    },
  },
}));

// ─── CORS ─────────────────────────────────────────────────
const allowedOrigins = [
  process.env.FRONTEND_URL,
  'http://localhost:3000',
].filter(Boolean);

// Additional Vercel preview URLs (set ALLOWED_VERCEL_PREFIX=knowlytics-hub in env)
const vercelPrefix = process.env.ALLOWED_VERCEL_PREFIX || '';

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else if (vercelPrefix && origin.endsWith('.vercel.app') && origin.includes(vercelPrefix)) {
      // Only allow Vercel preview URLs matching your project prefix
      callback(null, true);
    } else {
      callback(new Error('CORS: origin not allowed'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Device-ID'],
}));

// ─── Global Rate Limiter ───────────────────────────────────
app.use(rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'),
  max: parseInt(process.env.RATE_LIMIT_MAX || '100'),
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.' },
}));

// ─── Local uploads static serving ─────────────────────────
// Only serve in dev; in production all file access goes through /api/files/stream (auth-protected)
if (process.env.NODE_ENV !== 'production') {
  app.use('/uploads', express.static(path.join(__dirname, '../uploads')));
}

// ─── Stripe webhook MUST receive raw body (mount BEFORE json parser) ──
const { stripeWebhook } = require('./routes/payments');
app.post('/api/payments/stripe/webhook',
  express.raw({ type: 'application/json' }),
  stripeWebhook
);

// ─── Body Parsing ─────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// ─── Health Check ─────────────────────────────────────────
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', service: 'Knowlytics Hub API', timestamp: new Date().toISOString() });
});

// ─── Public Landing Stats (no auth needed) ────────────────
app.get('/api/public/stats', async (_req, res) => {
  try {
    const { query: dbQuery } = require('./config/database');
    const [students, courses, avgRating] = await Promise.all([
      dbQuery("SELECT COUNT(*)::int AS count FROM users WHERE role = 'student' AND is_active = true"),
      dbQuery("SELECT COUNT(*)::int AS count FROM courses WHERE is_published = true"),
      dbQuery("SELECT COALESCE(AVG(rating), 0)::numeric(3,1) AS avg FROM course_reviews WHERE is_visible = true"),
    ]);
    res.json({
      students: students.rows[0].count,
      courses: courses.rows[0].count,
      satisfaction: avgRating.rows[0].avg,
    });
  } catch {
    res.json({ students: 0, courses: 0, satisfaction: 0 });
  }
});

// ─── Public Featured Courses (no auth needed) ──────────────
app.get('/api/public/featured-courses', async (_req, res) => {
  try {
    const { query: dbQuery } = require('./config/database');
    const result = await dbQuery(
      `SELECT c.id, c.title, c.description, c.type, c.level, c.price,
              c.thumbnail_url, c.promo_video_url, c.duration_hours, c.avg_rating, c.review_count,
              COUNT(DISTINCT e.id)::int AS enrollment_count,
              COALESCE(i.name, u.name) AS instructor_name,
              i.photo_url AS instructor_photo
       FROM courses c
       LEFT JOIN users u ON u.id = c.instructor_id
       LEFT JOIN instructors i ON i.id = c.instructor_profile_id
       LEFT JOIN enrollments e ON e.course_id = c.id
       WHERE c.is_published = true
       GROUP BY c.id, u.name, i.name, i.photo_url
       ORDER BY c.created_at DESC
       LIMIT 6`
    );
    res.json(result.rows);
  } catch {
    res.json([]);
  }
});

// ─── Public Reviews for Landing Page (no auth needed) ───────
app.get('/api/public/reviews', async (_req, res) => {
  try {
    const { query: dbQuery } = require('./config/database');
    const result = await dbQuery(
      `SELECT r.rating, r.comment, r.created_at,
              u.name AS user_name, u.avatar_url,
              c.title AS course_title
       FROM course_reviews r
       JOIN users u ON u.id = r.user_id
       JOIN courses c ON c.id = r.course_id
       WHERE r.is_visible = true AND r.comment IS NOT NULL AND r.comment != ''
       ORDER BY r.rating DESC, r.created_at DESC
       LIMIT 8`
    );
    res.json(result.rows);
  } catch {
    res.json([]);
  }
});

// ─── API Routes ───────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/lessons', lessonRoutes);
app.use('/api/quizzes', quizRoutes);
app.use('/api/enrollments', enrollmentRoutes);
app.use('/api/users', userRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/files', fileRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/zoom', zoomRoutes);
app.use('/api/assignments', assignmentRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/batches', batchRoutes);
app.use('/api/certificates', certificateRoutes);
app.use('/api/coupons', couponRoutes);
app.use('/api/bundles', bundleRoutes);
app.use('/api/notes', notesRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/courses/:courseId/reviews', reviewRoutes);
app.use('/api/badges', badgeRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/subscriptions', subscriptionRoutes);
app.use('/api/teams', teamRoutes);
app.use('/api/calendar', calendarRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/referrals', referralRoutes);
app.use('/api/discussions', discussionRoutes);
app.use('/api/instructors', instructorRoutes);
app.use('/api/ai', aiRoutes);

// ─── Admin broadcast ──────────────────────────────────────
const { authenticate, authorize } = require('./middleware/auth');
app.post('/api/admin/broadcast',  authenticate, authorize('admin'), sendBroadcast);
app.get('/api/admin/broadcasts',  authenticate, authorize('admin'), getBroadcastHistory);

// ─── 404 ──────────────────────────────────────────────────
app.use((_req, res) => res.status(404).json({ error: 'Route not found' }));

// ─── Error Handler ────────────────────────────────────────
app.use(errorHandler);

// ─── Start Server ─────────────────────────────────────────
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`\n🚀  Knowlytics Hub API running on port ${PORT} [${process.env.NODE_ENV}]`);
});

module.exports = app;
