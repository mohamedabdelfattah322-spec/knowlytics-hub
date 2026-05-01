const { query } = require('../config/database');

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

    res.json({ score_pct: scorePct, earned_points: earnedPoints, total_points: totalPoints, level, feedback });
  } catch (err) {
    next(err);
  }
};

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

module.exports = { getQuiz, submitQuiz, createQuiz, getResults };
