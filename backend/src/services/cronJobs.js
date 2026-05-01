const cron = require('node-cron');
const { query } = require('../config/database');
const emailService = require('./emailService');

/**
 * Runs daily at 9 AM — finds students inactive for 7+ days in active courses
 * and sends a reminder email.
 */
const inactivityReminder = cron.schedule('0 9 * * *', async () => {
  console.log('[CRON] Running inactivity reminder job');
  try {
    const result = await query(
      `SELECT u.id, u.email, u.name, c.id AS course_id, c.title
       FROM enrollments e
       JOIN users u ON u.id = e.user_id
       JOIN courses c ON c.id = e.course_id
       WHERE e.is_active = true
         AND e.progress_pct < 100
         AND e.last_activity < NOW() - INTERVAL '7 days'
         AND NOT EXISTS (
           SELECT 1 FROM notifications n
           WHERE n.user_id = u.id AND n.type = 'inactivity'
             AND n.created_at > NOW() - INTERVAL '7 days'
         )`
    );

    for (const row of result.rows) {
      await emailService.sendInactivityReminder({ email: row.email, name: row.name }, { title: row.title }).catch(console.error);
      await query(
        `INSERT INTO notifications (user_id, message, type) VALUES ($1, $2, 'inactivity')`,
        [row.id, `Reminder: Resume your course "${row.title}"`]
      );
    }
    console.log(`[CRON] Sent ${result.rows.length} inactivity reminders`);
  } catch (err) {
    console.error('[CRON] Inactivity reminder error:', err);
  }
}, { scheduled: false });

/**
 * Runs every 5 minutes — cleans expired sessions older than 30 days.
 */
const sessionCleanup = cron.schedule('*/5 * * * *', async () => {
  try {
    const result = await query(
      `DELETE FROM sessions WHERE is_active = false AND created_at < NOW() - INTERVAL '30 days'`
    );
    if (result.rowCount > 0) {
      console.log(`[CRON] Cleaned ${result.rowCount} expired sessions`);
    }
  } catch (err) {
    console.error('[CRON] Session cleanup error:', err);
  }
}, { scheduled: false });

const startAll = () => {
  inactivityReminder.start();
  sessionCleanup.start();
  console.log('[CRON] All scheduled jobs started');
};

module.exports = { startAll };
