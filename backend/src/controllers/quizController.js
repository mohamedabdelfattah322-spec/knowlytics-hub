const { query } = require('../config/database');

// GET /api/quizzes/course/:courseId  — list all quizzes for a course (admin)
const getQuizzesByCourse = async (req, res, next) => {
  try {
    const { courseId } = req.params;
    const result = await query(
      `SELECT q.id, q.title, q.description, q.section_id, s.title AS section_title,
              COUNT(DISTINCT qq.id) AS question_count,
              COUNT(DISTINCT qa2.id) AS attempt_count
       FROM quizzes q
       JOIN sections s ON s.id = q.section_id
       LEFT JOIN quiz_questions qq ON qq.quiz_id = q.id
       LEFT JOIN quiz_attempts qa2 ON qa2.quiz_id = q.id
       WHERE s.course_id = $1
       GROUP BY q.id, q.title, q.description, q.section_id, s.title, s.order_index
       ORDER BY s.order_index, q.id`,
      [courseId]
    );
    res.json(result.rows);
  } catch (err) { next(err); }
};

// DELETE /api/quizzes/:id  (admin)
const deleteQuiz = async (req, res, next) => {
  try {
    await query(`DELETE FROM quizzes WHERE id = $1`, [req.params.id]);
    res.json({ ok: true });
  } catch (err) { next(err); }
};

// GET /api/quizzes/:id  — quiz with questions (no correct answers exposed)
const getQuiz = async (req, res, next) => {
  try {
    const { id } = req.params;
    const quizResult = await query(
      `SELECT q.*, s.course_id FROM quizzes q JOIN sections s ON s.id = q.section_id WHERE q.id = $1`,
      [id]
    );
    if (!quizResult.rows.length) return res.status(404).json({ error: 'Quiz not found' });

    const quiz = quizResult.rows[0];

    // Verify enrollment
    if (req.user.role !== 'admin') {
      const enroll = await query(
        `SELECT id FROM enrollments WHERE user_id = $1 AND course_id = $2 AND is_active = true`,
        [req.user.user_id, quiz.course_id]
      );
      if (!enroll.rows.length) return res.status(403).json({ error: 'Not enrolled' });
    }

    const questions = await query(
      `SELECT qq.id, qq.question_text, qq.question_type, qq.points, qq.order_index,
              json_agg(
                json_build_object('id', qa.id, 'text', qa.answer_text, 'order_index', qa.order_index)
                ORDER BY qa.order_index
              ) AS answers
       FROM quiz_questions qq
       LEFT JOIN quiz_answers qa ON qa.question_id = qq.id
       WHERE qq.quiz_id = $1
       GROUP BY qq.id
       ORDER BY qq.order_index`,
      [id]
    );

    res.json({ quiz, questions: questions.rows });
  } catch (err) {
    next(err);
  }
};

// POST /api/quizzes/:id/submit  — Duolingo-style, returns instant feedback
const submitQuiz = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { answers } = req.body; // [{ question_id, answer_id }]
    const userId = req.user.user_id;

    const quizResult = await query(
      `SELECT q.*, s.course_id FROM quizzes q JOIN sections s ON s.id = q.section_id WHERE q.id = $1`,
      [id]
    );
    if (!quizResult.rows.length) return res.status(404).json({ error: 'Quiz not found' });
    const quiz = quizResult.rows[0];

    // Fetch all correct answers in one query
    const correctResult = await query(
      `SELECT qa.id AS answer_id, qa.question_id, qq.points
       FROM quiz_answers qa
       JOIN quiz_questions qq ON qq.id = qa.question_id
       WHERE qq.quiz_id = $1 AND qa.is_correct = true`,
      [id]
    );
    const correctMap = {};
    correctResult.rows.forEach((r) => {
      correctMap[r.question_id] = { answer_id: r.answer_id, points: r.points };
    });

    // Calculate score with per-question feedback
    let totalPoints = 0;
    let earnedPoints = 0;
    const feedback = [];

    for (const ans of answers) {
      const correct = correctMap[ans.question_id];
      if (!correct) continue;
      totalPoints += correct.points;
      const isCorrect = String(ans.answer_id) === String(correct.answer_id);
      if (isCorrect) earnedPoints += correct.points;
      feedback.push({
        question_id: ans.question_id,
        is_correct: isCorrect,
        correct_answer_id: correct.answer_id,
        points_earned: isCorrect ? correct.points : 0,
      });
    }

    const scorePct = totalPoints > 0 ? Math.round((earnedPoints / totalPoints) * 100) : 0;
    const level = scorePct >= 80 ? 'Advanced' : scorePct >= 50 ? 'Intermediate' : 'Beginner';

    // Persist attempt
    await query(
      `INSERT INTO quiz_attempts (user_id, quiz_id, course_id, score_pct, earned_points, total_points, level)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [userId, id, quiz.course_id, scorePct, earnedPoints, totalPoints, level]
    );

    // ── Award XP: 10 base + score bonus (max 20 extra) ──
    const xpEarned = 10 + Math.round(scorePct / 5);
    await query('UPDATE users SET xp = xp + $1 WHERE id = $2', [xpEarned, userId]);

    // ── Update streak ──
    await _updateStreak(userId);

    // ── Check & award badges ──
    const newBadges = await _checkAndAwardBadges(userId);

    // ── Recalculate level (500 XP per level) ──
    await query('UPDATE users SET level = GREATEST(1, (xp / 500) + 1) WHERE id = $1', [userId]);

    // ── Fetch previous attempts for this quiz ──
    const attemptsResult = await query(
      `SELECT score_pct, earned_points, total_points, level, created_at
       FROM quiz_attempts WHERE quiz_id = $1 AND user_id = $2
       ORDER BY created_at DESC LIMIT 10`,
      [id, userId]
    );

    // ── User stats after update ──
    const statsResult = await query(
      'SELECT xp, level, streak_days FROM users WHERE id = $1',
      [userId]
    );

    res.json({
      score_pct: scorePct,
      earned_points: earnedPoints,
      total_points: totalPoints,
      level,
      feedback,
      xp_earned: xpEarned,
      new_badges: newBadges,
      user_stats: statsResult.rows[0] || {},
      attempts: attemptsResult.rows,
    });
  } catch (err) {
    next(err);
  }
};

// Internal helper: check all badge conditions and award any newly earned badges
async function _checkAndAwardBadges(userId) {
  const awarded = [];
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
           WHERE qa.user_id = $1 AND qa.score_pct >= COALESCE(q.passing_score, 60)`,
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
        'INSERT INTO user_badges (user_id, badge_id) VALUES ($1, $2) ON CONFLICT DO NOTHING RETURNING *',
        [userId, badge.id]
      );
      if (badge.xp_reward > 0) {
        await query('UPDATE users SET xp = xp + $1 WHERE id = $2', [badge.xp_reward, userId]);
      }
      awarded.push(badge);
    }
  }
  return awarded;
}

// Internal helper: update daily streak
async function _updateStreak(userId) {
  const result = await query('SELECT last_activity_date, streak_days FROM users WHERE id = $1', [userId]);
  if (!result.rows.length) return;
  const { last_activity_date, streak_days } = result.rows[0];
  const today = new Date().toISOString().split('T')[0];
  if (last_activity_date === today) return;
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
  const newStreak = last_activity_date === yesterday ? (streak_days || 0) + 1 : 1;
  await query(
    'UPDATE users SET streak_days = $1, last_activity_date = $2 WHERE id = $3',
    [newStreak, today, userId]
  );
}

// POST /api/quizzes  (admin)
const createQuiz = async (req, res, next) => {
  try {
    const { section_id, title, description, questions } = req.body;

    const quizResult = await query(
      `INSERT INTO quizzes (section_id, title, description) VALUES ($1, $2, $3) RETURNING *`,
      [section_id, title, description]
    );
    const quiz = quizResult.rows[0];

    // Bulk-insert questions and answers
    for (let qi = 0; qi < questions.length; qi++) {
      const q = questions[qi];
      const qqResult = await query(
        `INSERT INTO quiz_questions (quiz_id, question_text, question_type, points, order_index)
         VALUES ($1, $2, $3, $4, $5) RETURNING id`,
        [quiz.id, q.question_text, q.question_type || 'multiple_choice', q.points || 1, qi]
      );
      const questionId = qqResult.rows[0].id;

      for (let ai = 0; ai < q.answers.length; ai++) {
        const a = q.answers[ai];
        await query(
          `INSERT INTO quiz_answers (question_id, answer_text, is_correct, order_index) VALUES ($1, $2, $3, $4)`,
          [questionId, a.text, !!a.is_correct, ai]
        );
      }
    }

    res.status(201).json({ quiz, message: `Quiz created with ${questions.length} questions` });
  } catch (err) {
    next(err);
  }
};

// GET /api/quizzes/:id/results  — student's past attempts
const getResults = async (req, res, next) => {
  try {
    const result = await query(
      `SELECT score_pct, earned_points, total_points, level, created_at
       FROM quiz_attempts WHERE quiz_id = $1 AND user_id = $2
       ORDER BY created_at DESC LIMIT 10`,
      [req.params.id, req.user.user_id]
    );
    res.json(result.rows);
  } catch (err) {
    next(err);
  }
};

// GET /api/quizzes/course/:courseId/leaderboard  — admin: ranked students
const getCourseLeaderboard = async (req, res, next) => {
  try {
    const { courseId } = req.params;

    const result = await query(
      `SELECT
         u.id, u.name, u.email, u.avatar_url, u.xp, u.level, u.streak_days,
         COUNT(DISTINCT qa.quiz_id)::int          AS quizzes_done,
         COUNT(qa.id)::int                        AS total_attempts,
         ROUND(AVG(qa.score_pct))::int            AS avg_score,
         MAX(qa.score_pct)::int                   AS best_score,
         COALESCE(SUM(qa.earned_points),0)::int   AS total_quiz_points,
         COUNT(DISTINCT sub.id)::int              AS tasks_done
       FROM enrollments e
       JOIN users u ON u.id = e.user_id
       LEFT JOIN quiz_attempts qa
         ON qa.user_id = e.user_id AND qa.course_id = e.course_id
       LEFT JOIN assignment_submissions sub
         ON sub.user_id = e.user_id
         AND sub.assignment_id IN (
           SELECT a.id FROM assignments a
           JOIN lessons l ON l.id = a.lesson_id
           JOIN sections s ON s.id = l.section_id
           WHERE s.course_id = e.course_id
         )
       WHERE e.course_id = $1 AND e.is_active = true
       GROUP BY u.id, u.name, u.email, u.avatar_url, u.xp, u.level, u.streak_days
       ORDER BY avg_score DESC NULLS LAST, total_quiz_points DESC, tasks_done DESC`,
      [courseId]
    );

    // Add rank
    const ranked = result.rows.map((row, i) => ({ ...row, rank: i + 1 }));
    res.json(ranked);
  } catch (err) { next(err); }
};

module.exports = { getQuiz, submitQuiz, createQuiz, getResults, getQuizzesByCourse, deleteQuiz, getCourseLeaderboard };
