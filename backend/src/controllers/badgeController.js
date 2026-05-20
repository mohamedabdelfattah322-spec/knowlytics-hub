const { query } = require('../config/database');

// GET /api/badges — all available badges
const listBadges = async (req, res, next) => {
  try {
    const result = await query('SELECT * FROM badges ORDER BY condition_type, condition_value');
    res.json(result.rows);
  } catch (err) { next(err); }
};

// GET /api/badges/my — current user's earned badges
const myBadges = async (req, res, next) => {
  try {
    const result = await query(
      `SELECT b.*, ub.earned_at
       FROM user_badges ub
       JOIN badges b ON b.id = ub.badge_id
       WHERE ub.user_id = $1
       ORDER BY ub.earned_at DESC`,
      [req.user.user_id]
    );

    // Also get XP & level
    const userStats = await query(
      'SELECT xp, level, streak_days FROM users WHERE id = $1',
      [req.user.user_id]
    );

    res.json({ badges: result.rows, stats: userStats.rows[0] });
  } catch (err) { next(err); }
};

// GET /api/badges/leaderboard
const leaderboard = async (req, res, next) => {
  try {
    const { limit = 20 } = req.query;
    const result = await query(
      `SELECT u.id, u.name, u.avatar_url, u.xp, u.level, u.streak_days,
              COUNT(ub.id)::int AS badge_count
       FROM users u
       LEFT JOIN user_badges ub ON ub.user_id = u.id
       WHERE u.role = 'student'
       GROUP BY u.id
       ORDER BY u.xp DESC
       LIMIT $1`,
      [limit]
    );
    res.json(result.rows);
  } catch (err) { next(err); }
};

// POST /api/badges/check — check & award badges for current user
// Called after key events (enrollment, quiz completion, etc.)
const checkAndAward = async (req, res, next) => {
  try {
    const userId = req.user.user_id;
    const awarded = [];

    // Get all badges not yet earned by this user
    const unearned = await query(
      `SELECT b.* FROM badges b
       WHERE b.id NOT IN (SELECT badge_id FROM user_badges WHERE user_id = $1)`,
      [userId]
    );

    for (const badge of unearned.rows) {
      let qualifies = false;

      switch (badge.condition_type) {
        case 'first_enrollment': {
          const r = await query('SELECT COUNT(*)::int AS c FROM enrollments WHERE user_id = $1', [userId]);
          qualifies = r.rows[0].c >= badge.condition_value;
          break;
        }
        case 'courses_completed': {
          const r = await query(
            'SELECT COUNT(*)::int AS c FROM enrollments WHERE user_id = $1 AND completed_at IS NOT NULL',
            [userId]
          );
          qualifies = r.rows[0].c >= badge.condition_value;
          break;
        }
        case 'quizzes_passed': {
          const r = await query(
            `SELECT COUNT(DISTINCT qa.quiz_id)::int AS c
             FROM quiz_attempts qa
             JOIN quizzes q ON q.id = qa.quiz_id
             WHERE qa.user_id = $1 AND qa.score_pct >= q.passing_score`,
            [userId]
          );
          qualifies = r.rows[0].c >= badge.condition_value;
          break;
        }
        case 'perfect_quiz': {
          const r = await query(
            'SELECT COUNT(*)::int AS c FROM quiz_attempts WHERE user_id = $1 AND score_pct = 100',
            [userId]
          );
          qualifies = r.rows[0].c >= badge.condition_value;
          break;
        }
        case 'streak_days': {
          const r = await query('SELECT streak_days FROM users WHERE id = $1', [userId]);
          qualifies = (r.rows[0]?.streak_days || 0) >= badge.condition_value;
          break;
        }
      }

      if (qualifies) {
        await query(
          'INSERT INTO user_badges (user_id, badge_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
          [userId, badge.id]
        );
        // Award XP
        if (badge.xp_reward > 0) {
          await query('UPDATE users SET xp = xp + $1 WHERE id = $2', [badge.xp_reward, userId]);
        }
        awarded.push(badge);
      }
    }

    // Recalculate level (every 500 XP = 1 level)
    await query('UPDATE users SET level = GREATEST(1, (xp / 500) + 1) WHERE id = $1', [userId]);

    // Update streak
    await _updateStreak(userId);

    res.json({ awarded, count: awarded.length });
  } catch (err) { next(err); }
};

// Helper: update daily streak
async function _updateStreak(userId) {
  const result = await query('SELECT last_activity_date, streak_days FROM users WHERE id = $1', [userId]);
  if (!result.rows.length) return;

  const { last_activity_date, streak_days } = result.rows[0];
  const today = new Date().toISOString().split('T')[0];

  if (last_activity_date === today) return; // Already updated today

  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
  const newStreak = last_activity_date === yesterday ? (streak_days || 0) + 1 : 1;

  await query(
    'UPDATE users SET streak_days = $1, last_activity_date = $2 WHERE id = $3',
    [newStreak, today, userId]
  );
}

module.exports = { listBadges, myBadges, leaderboard, checkAndAward };
