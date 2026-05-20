const { query } = require('../config/database');

// ──────────────────────────────────────────────
//  VIDEO TRACKING
// ──────────────────────────────────────────────

// POST /api/analytics/video/session — start a watch session
const startVideoSession = async (req, res, next) => {
  try {
    const { lesson_id, course_id, video_total_seconds, device_type, browser } = req.body;
    const result = await query(
      `INSERT INTO video_watch_sessions
        (user_id, lesson_id, course_id, video_total_seconds, device_type, browser, ip_address)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id`,
      [req.user.user_id, lesson_id, course_id, video_total_seconds || 0,
       device_type || 'desktop', browser || '', req.ip]
    );
    res.status(201).json({ session_id: result.rows[0].id });
  } catch (err) { next(err); }
};

// PUT /api/analytics/video/session/:id — update session (heartbeat / end)
const updateVideoSession = async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      duration_seconds, max_position_seconds, completed,
      play_count, pause_count, seek_forward_count, seek_backward_count,
      replay_count, speed_changes, last_speed, fullscreen_count, buffer_count
    } = req.body;

    await query(
      `UPDATE video_watch_sessions SET
        duration_seconds = COALESCE($2, duration_seconds),
        max_position_seconds = GREATEST(max_position_seconds, COALESCE($3, 0)),
        completed = COALESCE($4, completed),
        play_count = COALESCE($5, play_count),
        pause_count = COALESCE($6, pause_count),
        seek_forward_count = COALESCE($7, seek_forward_count),
        seek_backward_count = COALESCE($8, seek_backward_count),
        replay_count = COALESCE($9, replay_count),
        speed_changes = COALESCE($10, speed_changes),
        last_speed = COALESCE($11, last_speed),
        fullscreen_count = COALESCE($12, fullscreen_count),
        buffer_count = COALESCE($13, buffer_count),
        ended_at = NOW()
       WHERE id = $1 AND user_id = $14`,
      [id, duration_seconds, max_position_seconds, completed,
       play_count, pause_count, seek_forward_count, seek_backward_count,
       replay_count, speed_changes, last_speed, fullscreen_count, buffer_count,
       req.user.user_id]
    );
    res.json({ ok: true });
  } catch (err) { next(err); }
};

// POST /api/analytics/video/event — log a single event (seek, pause, etc.)
const logVideoEvent = async (req, res, next) => {
  try {
    const { session_id, lesson_id, event_type, from_seconds, to_seconds, data } = req.body;
    await query(
      `INSERT INTO video_events (session_id, user_id, lesson_id, event_type, from_seconds, to_seconds, data)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [session_id, req.user.user_id, lesson_id, event_type, from_seconds || 0, to_seconds || 0, data || {}]
    );
    res.status(201).json({ ok: true });
  } catch (err) { next(err); }
};

// POST /api/analytics/video/events-batch — bulk events
const logVideoEventsBatch = async (req, res, next) => {
  try {
    const { events } = req.body; // array of { session_id, lesson_id, event_type, from_seconds, to_seconds, data }
    if (!events?.length) return res.json({ ok: true });

    const values = [];
    const params = [];
    let idx = 1;
    for (const e of events) {
      values.push(`($${idx++}, $${idx++}, $${idx++}, $${idx++}, $${idx++}, $${idx++}, $${idx++})`);
      params.push(e.session_id, req.user.user_id, e.lesson_id, e.event_type,
                  e.from_seconds || 0, e.to_seconds || 0, e.data || {});
    }

    await query(
      `INSERT INTO video_events (session_id, user_id, lesson_id, event_type, from_seconds, to_seconds, data)
       VALUES ${values.join(', ')}`,
      params
    );
    res.status(201).json({ ok: true, count: events.length });
  } catch (err) { next(err); }
};

// ──────────────────────────────────────────────
//  CART TRACKING
// ──────────────────────────────────────────────

// POST /api/analytics/cart-event
const logCartEvent = async (req, res, next) => {
  try {
    const { course_id, bundle_id, event_type, payment_method, amount, metadata } = req.body;
    await query(
      `INSERT INTO cart_events (user_id, course_id, bundle_id, event_type, payment_method, amount, metadata)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [req.user.user_id, course_id || null, bundle_id || null,
       event_type, payment_method || null, amount || 0, metadata || {}]
    );
    res.status(201).json({ ok: true });
  } catch (err) { next(err); }
};

// ──────────────────────────────────────────────
//  PAGE VIEW TRACKING
// ──────────────────────────────────────────────

// POST /api/analytics/page-view
const logPageView = async (req, res, next) => {
  try {
    const { page_path, referrer, device_type, browser, session_duration_seconds } = req.body;
    await query(
      `INSERT INTO page_views (user_id, page_path, referrer, device_type, browser, session_duration_seconds)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [req.user?.user_id || null, page_path, referrer || null,
       device_type || 'desktop', browser || '', session_duration_seconds || 0]
    );
    res.status(201).json({ ok: true });
  } catch (err) { next(err); }
};

// ──────────────────────────────────────────────
//  ADMIN ANALYTICS ENDPOINTS
// ──────────────────────────────────────────────

// GET /api/analytics/overview — main dashboard overview
const getOverview = async (req, res, next) => {
  try {
    const { days = 30 } = req.query;
    const since = `NOW() - INTERVAL '${parseInt(days)} days'`;

    const [
      videoStats,
      cartStats,
      topCoursesByWatch,
      topCoursesByEnrollment,
      dailyActivity,
      userEngagement,
      paymentMethods,
      cartAbandonment,
      peakHours,
      deviceBreakdown,
      revenueByDay,
    ] = await Promise.all([
      // Total video stats
      query(`
        SELECT
          COUNT(*) AS total_sessions,
          COALESCE(SUM(duration_seconds), 0) AS total_watch_seconds,
          COALESCE(AVG(duration_seconds), 0) AS avg_session_seconds,
          COUNT(DISTINCT user_id) AS unique_viewers,
          COUNT(DISTINCT lesson_id) AS unique_lessons,
          COALESCE(SUM(seek_forward_count), 0) AS total_seeks_forward,
          COALESCE(SUM(seek_backward_count), 0) AS total_seeks_backward,
          COALESCE(SUM(pause_count), 0) AS total_pauses,
          COALESCE(SUM(replay_count), 0) AS total_replays,
          COUNT(*) FILTER (WHERE completed) AS completed_videos
        FROM video_watch_sessions
        WHERE started_at >= ${since}
      `),

      // Cart stats
      query(`
        SELECT
          COUNT(*) FILTER (WHERE event_type = 'add_to_cart') AS total_adds,
          COUNT(*) FILTER (WHERE event_type = 'remove_from_cart') AS total_removes,
          COUNT(*) FILTER (WHERE event_type = 'checkout_complete') AS total_purchases,
          COUNT(*) FILTER (WHERE event_type = 'checkout_abandon') AS total_abandons,
          COUNT(DISTINCT user_id) FILTER (WHERE event_type = 'add_to_cart') AS unique_adders,
          COUNT(DISTINCT user_id) FILTER (WHERE event_type = 'checkout_complete') AS unique_buyers,
          COALESCE(SUM(amount) FILTER (WHERE event_type = 'checkout_complete'), 0) AS total_revenue
        FROM cart_events
        WHERE created_at >= ${since}
      `),

      // Top courses by watch time
      query(`
        SELECT c.title, c.id AS course_id,
          COALESCE(SUM(v.duration_seconds), 0) AS total_watch_seconds,
          COUNT(DISTINCT v.user_id) AS unique_viewers,
          COUNT(*) AS session_count
        FROM video_watch_sessions v
        JOIN courses c ON c.id = v.course_id
        WHERE v.started_at >= ${since}
        GROUP BY c.id, c.title
        ORDER BY total_watch_seconds DESC
        LIMIT 10
      `),

      // Top courses by enrollment
      query(`
        SELECT c.title, c.id AS course_id,
          COUNT(*) AS enrollment_count,
          c.price
        FROM enrollments e
        JOIN courses c ON c.id = e.course_id
        WHERE e.enrolled_at >= ${since}
        GROUP BY c.id, c.title, c.price
        ORDER BY enrollment_count DESC
        LIMIT 10
      `),

      // Daily activity (enrollments, watch time, page views)
      query(`
        WITH days AS (
          SELECT generate_series(
            (${since})::date,
            CURRENT_DATE,
            '1 day'::interval
          )::date AS d
        )
        SELECT
          d.d AS date,
          COALESCE(e.cnt, 0) AS enrollments,
          COALESCE(v.secs, 0) AS watch_seconds,
          COALESCE(v.sessions, 0) AS video_sessions,
          COALESCE(p.cnt, 0) AS page_views
        FROM days d
        LEFT JOIN (
          SELECT enrolled_at::date AS dt, COUNT(*) AS cnt FROM enrollments
          WHERE enrolled_at >= ${since} GROUP BY dt
        ) e ON e.dt = d.d
        LEFT JOIN (
          SELECT started_at::date AS dt, SUM(duration_seconds) AS secs, COUNT(*) AS sessions
          FROM video_watch_sessions WHERE started_at >= ${since} GROUP BY dt
        ) v ON v.dt = d.d
        LEFT JOIN (
          SELECT created_at::date AS dt, COUNT(*) AS cnt FROM page_views
          WHERE created_at >= ${since} GROUP BY dt
        ) p ON p.dt = d.d
        ORDER BY d.d
      `),

      // User engagement: avg watch time per user
      query(`
        SELECT
          COUNT(DISTINCT user_id) AS active_users,
          COALESCE(AVG(user_total), 0) AS avg_watch_per_user,
          COALESCE(MAX(user_total), 0) AS max_watch_user
        FROM (
          SELECT user_id, SUM(duration_seconds) AS user_total
          FROM video_watch_sessions
          WHERE started_at >= ${since}
          GROUP BY user_id
        ) sub
      `),

      // Payment methods breakdown
      query(`
        SELECT payment_method,
          COUNT(*) AS count,
          COALESCE(SUM(amount), 0) AS total_amount
        FROM cart_events
        WHERE event_type = 'checkout_complete'
          AND created_at >= ${since}
          AND payment_method IS NOT NULL
        GROUP BY payment_method
        ORDER BY count DESC
      `),

      // Cart abandonment: courses added but not purchased
      query(`
        SELECT c.title, c.id AS course_id, c.price,
          COUNT(*) FILTER (WHERE ce.event_type = 'add_to_cart') AS adds,
          COUNT(*) FILTER (WHERE ce.event_type = 'checkout_complete') AS purchases
        FROM cart_events ce
        JOIN courses c ON c.id = ce.course_id
        WHERE ce.created_at >= ${since}
        GROUP BY c.id, c.title, c.price
        HAVING COUNT(*) FILTER (WHERE ce.event_type = 'add_to_cart') > 0
        ORDER BY (COUNT(*) FILTER (WHERE ce.event_type = 'add_to_cart') -
                  COUNT(*) FILTER (WHERE ce.event_type = 'checkout_complete')) DESC
        LIMIT 10
      `),

      // Peak hours
      query(`
        SELECT EXTRACT(HOUR FROM started_at) AS hour,
          COUNT(*) AS session_count,
          COALESCE(SUM(duration_seconds), 0) AS watch_seconds
        FROM video_watch_sessions
        WHERE started_at >= ${since}
        GROUP BY hour
        ORDER BY hour
      `),

      // Device breakdown
      query(`
        SELECT device_type,
          COUNT(*) AS count,
          COALESCE(SUM(duration_seconds), 0) AS watch_seconds
        FROM video_watch_sessions
        WHERE started_at >= ${since}
        GROUP BY device_type
        ORDER BY count DESC
      `),

      // Revenue by day
      query(`
        WITH days AS (
          SELECT generate_series(
            (${since})::date,
            CURRENT_DATE,
            '1 day'::interval
          )::date AS d
        )
        SELECT d.d AS date,
          COALESCE(SUM(p.amount), 0) AS revenue,
          COUNT(p.id) AS transactions
        FROM days d
        LEFT JOIN payments p ON p.paid_at::date = d.d AND p.status = 'paid'
        GROUP BY d.d
        ORDER BY d.d
      `),
    ]);

    res.json({
      period_days: parseInt(days),
      video: videoStats.rows[0],
      cart: cartStats.rows[0],
      top_courses_by_watch: topCoursesByWatch.rows,
      top_courses_by_enrollment: topCoursesByEnrollment.rows,
      daily_activity: dailyActivity.rows,
      user_engagement: userEngagement.rows[0],
      payment_methods: paymentMethods.rows,
      cart_abandonment: cartAbandonment.rows,
      peak_hours: peakHours.rows,
      device_breakdown: deviceBreakdown.rows,
      revenue_by_day: revenueByDay.rows,
    });
  } catch (err) { next(err); }
};

// GET /api/analytics/user/:userId — individual user analytics
const getUserAnalytics = async (req, res, next) => {
  try {
    const { userId } = req.params;

    const [watchHistory, cartHistory, lessonProgress, userInfo] = await Promise.all([
      query(`
        SELECT v.lesson_id, l.title AS lesson_title, c.title AS course_title,
          SUM(v.duration_seconds) AS total_seconds,
          COUNT(*) AS session_count,
          MAX(v.max_position_seconds) AS max_position,
          SUM(v.seek_forward_count) AS seeks_fwd,
          SUM(v.seek_backward_count) AS seeks_bwd,
          SUM(v.pause_count) AS pauses,
          SUM(v.replay_count) AS replays,
          MAX(v.started_at) AS last_watched
        FROM video_watch_sessions v
        JOIN lessons l ON l.id = v.lesson_id
        JOIN courses c ON c.id = v.course_id
        WHERE v.user_id = $1
        GROUP BY v.lesson_id, l.title, c.title
        ORDER BY last_watched DESC
        LIMIT 50
      `, [userId]),

      query(`
        SELECT ce.event_type, ce.created_at, ce.amount, ce.payment_method,
          c.title AS course_title, b.name AS bundle_name
        FROM cart_events ce
        LEFT JOIN courses c ON c.id = ce.course_id
        LEFT JOIN bundles b ON b.id = ce.bundle_id
        WHERE ce.user_id = $1
        ORDER BY ce.created_at DESC
        LIMIT 50
      `, [userId]),

      query(`
        SELECT lp.lesson_id, l.title, lp.completed, lp.completed_at,
          c.title AS course_title
        FROM lesson_progress lp
        JOIN lessons l ON l.id = lp.lesson_id
        JOIN sections s ON s.id = l.section_id
        JOIN courses c ON c.id = s.course_id
        WHERE lp.user_id = $1
        ORDER BY lp.completed_at DESC NULLS LAST
      `, [userId]),

      query(`
        SELECT u.name, u.email, u.student_type, u.created_at,
          (SELECT COUNT(*) FROM enrollments WHERE user_id = $1 AND is_active = true) AS enrolled_courses,
          (SELECT COALESCE(SUM(duration_seconds), 0) FROM video_watch_sessions WHERE user_id = $1) AS total_watch_seconds,
          (SELECT COUNT(DISTINCT lesson_id) FROM video_watch_sessions WHERE user_id = $1) AS lessons_watched,
          (SELECT MAX(started_at) FROM video_watch_sessions WHERE user_id = $1) AS last_active
        FROM users u WHERE u.id = $1
      `, [userId]),
    ]);

    res.json({
      user: userInfo.rows[0],
      watch_history: watchHistory.rows,
      cart_history: cartHistory.rows,
      lesson_progress: lessonProgress.rows,
    });
  } catch (err) { next(err); }
};

// GET /api/analytics/course/:courseId — course-level analytics
const getCourseAnalytics = async (req, res, next) => {
  try {
    const { courseId } = req.params;
    const { days = 30 } = req.query;
    const since = `NOW() - INTERVAL '${parseInt(days)} days'`;

    const [lessonStats, dropOff, dailyStats, topViewers] = await Promise.all([
      // Per-lesson stats
      query(`
        SELECT l.id, l.title, s.title AS section_title,
          COUNT(DISTINCT v.user_id) AS unique_viewers,
          COUNT(*) AS session_count,
          COALESCE(SUM(v.duration_seconds), 0) AS total_watch_seconds,
          COALESCE(AVG(v.duration_seconds), 0) AS avg_watch_seconds,
          COALESCE(AVG(v.max_position_seconds), 0) AS avg_max_position,
          COALESCE(SUM(v.seek_backward_count), 0) AS total_rewinds,
          COUNT(*) FILTER (WHERE v.completed) AS completions
        FROM lessons l
        JOIN sections s ON s.id = l.section_id
        LEFT JOIN video_watch_sessions v ON v.lesson_id = l.id AND v.started_at >= ${since}
        WHERE s.course_id = $1
        GROUP BY l.id, l.title, s.title, l.sort_order, s.sort_order
        ORDER BY s.sort_order, l.sort_order
      `, [courseId]),

      // Drop-off analysis: where do students stop?
      query(`
        SELECT l.title,
          COUNT(DISTINCT lp.user_id) FILTER (WHERE lp.completed) AS completed,
          (SELECT COUNT(*) FROM enrollments WHERE course_id = $1 AND is_active = true) AS total_enrolled
        FROM lessons l
        JOIN sections s ON s.id = l.section_id
        LEFT JOIN lesson_progress lp ON lp.lesson_id = l.id
        WHERE s.course_id = $1
        GROUP BY l.id, l.title, l.sort_order, s.sort_order
        ORDER BY s.sort_order, l.sort_order
      `, [courseId]),

      // Daily stats for this course
      query(`
        SELECT started_at::date AS date,
          COUNT(*) AS sessions,
          COUNT(DISTINCT user_id) AS viewers,
          COALESCE(SUM(duration_seconds), 0) AS watch_seconds
        FROM video_watch_sessions
        WHERE course_id = $1 AND started_at >= ${since}
        GROUP BY date
        ORDER BY date
      `, [courseId]),

      // Top viewers
      query(`
        SELECT u.name, u.email, u.id AS user_id,
          SUM(v.duration_seconds) AS total_watch_seconds,
          COUNT(*) AS session_count,
          COUNT(DISTINCT v.lesson_id) AS lessons_watched
        FROM video_watch_sessions v
        JOIN users u ON u.id = v.user_id
        WHERE v.course_id = $1 AND v.started_at >= ${since}
        GROUP BY u.id, u.name, u.email
        ORDER BY total_watch_seconds DESC
        LIMIT 20
      `, [courseId]),
    ]);

    res.json({
      lesson_stats: lessonStats.rows,
      drop_off: dropOff.rows,
      daily_stats: dailyStats.rows,
      top_viewers: topViewers.rows,
    });
  } catch (err) { next(err); }
};

// GET /api/analytics/realtime — live active users
const getRealtime = async (req, res, next) => {
  try {
    const [activeNow, recentEvents] = await Promise.all([
      query(`
        SELECT COUNT(DISTINCT user_id) AS active_viewers,
          COUNT(*) AS active_sessions
        FROM video_watch_sessions
        WHERE ended_at IS NULL AND started_at >= NOW() - INTERVAL '30 minutes'
      `),
      query(`
        SELECT ve.event_type, ve.created_at, u.name, l.title AS lesson_title
        FROM video_events ve
        JOIN users u ON u.id = ve.user_id
        JOIN lessons l ON l.id = ve.lesson_id
        WHERE ve.created_at >= NOW() - INTERVAL '5 minutes'
        ORDER BY ve.created_at DESC
        LIMIT 20
      `),
    ]);
    res.json({
      active_viewers: parseInt(activeNow.rows[0].active_viewers),
      active_sessions: parseInt(activeNow.rows[0].active_sessions),
      recent_events: recentEvents.rows,
    });
  } catch (err) { next(err); }
};

module.exports = {
  startVideoSession, updateVideoSession, logVideoEvent, logVideoEventsBatch,
  logCartEvent, logPageView,
  getOverview, getUserAnalytics, getCourseAnalytics, getRealtime,
};
