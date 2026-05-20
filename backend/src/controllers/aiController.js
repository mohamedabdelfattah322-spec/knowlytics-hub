const { query } = require('../config/database');
const axios = require('axios');

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

// ──────────────────────────────────────────────
//  HELPER: Call OpenAI Chat Completion
// ──────────────────────────────────────────────
const callAI = async (systemPrompt, userPrompt, options = {}) => {
  if (!OPENAI_API_KEY) throw new Error('OPENAI_API_KEY not configured');

  const response = await axios.post(
    'https://api.openai.com/v1/chat/completions',
    {
      model: options.model || 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: options.temperature || 0.7,
      max_tokens: options.max_tokens || 2000,
      response_format: options.json ? { type: 'json_object' } : undefined,
    },
    {
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      timeout: 60000,
    }
  );

  return response.data.choices[0].message.content;
};

// ──────────────────────────────────────────────
//  AI QUIZ GENERATOR
// ──────────────────────────────────────────────

// POST /api/ai/generate-quiz
const generateQuiz = async (req, res, next) => {
  try {
    const { lesson_id, course_id, content, num_questions = 5, difficulty = 'mixed', language = 'ar' } = req.body;

    // Get lesson content if not provided
    let lessonContent = content;
    if (!lessonContent && lesson_id) {
      const lesson = await query(
        `SELECT l.title, l.content, s.title AS section_title, c.title AS course_title
         FROM lessons l
         JOIN sections s ON s.id = l.section_id
         JOIN courses c ON c.id = s.course_id
         WHERE l.id = $1`,
        [lesson_id]
      );
      if (lesson.rows.length) {
        const l = lesson.rows[0];
        lessonContent = `Course: ${l.course_title}\nSection: ${l.section_title}\nLesson: ${l.title}\n\nContent:\n${l.content || 'No text content available'}`;
      }
    }

    if (!lessonContent) return res.status(400).json({ error: 'No content to generate quiz from' });

    const systemPrompt = `You are an expert educational quiz creator. Generate a quiz based on the provided course content.
Rules:
- Generate exactly ${num_questions} multiple-choice questions
- Each question must have exactly 4 options (A, B, C, D)
- Indicate the correct answer
- Include a brief explanation for each answer
- Difficulty: ${difficulty}
- Language: ${language === 'ar' ? 'Arabic' : 'English'}
- Make questions that test understanding, not just memorization
- Return ONLY valid JSON in this exact format:
{
  "questions": [
    {
      "question": "...",
      "options": ["A) ...", "B) ...", "C) ...", "D) ..."],
      "correct_answer": 0,
      "explanation": "..."
    }
  ]
}`;

    const result = await callAI(systemPrompt, lessonContent, { json: true, temperature: 0.6 });
    const parsed = JSON.parse(result);

    res.json({
      questions: parsed.questions,
      metadata: { num_questions, difficulty, language, generated_at: new Date().toISOString() },
    });
  } catch (err) {
    console.error('AI Quiz generation error:', err.message);
    if (err.message === 'OPENAI_API_KEY not configured') {
      return res.status(503).json({ error: 'AI service not configured. Add OPENAI_API_KEY to environment.' });
    }
    next(err);
  }
};

// POST /api/ai/save-generated-quiz — save AI quiz as real quiz
const saveGeneratedQuiz = async (req, res, next) => {
  try {
    const { lesson_id, title, questions, passing_score = 70 } = req.body;

    if (!lesson_id || !questions?.length) {
      return res.status(400).json({ error: 'lesson_id and questions required' });
    }

    // Create quiz
    const quiz = await query(
      `INSERT INTO quizzes (lesson_id, title, passing_score, time_limit_minutes)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [lesson_id, title || 'AI Generated Quiz', passing_score, questions.length * 2]
    );

    // Insert questions
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      await query(
        `INSERT INTO quiz_questions (quiz_id, question_text, options, correct_answer, explanation, sort_order)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [quiz.rows[0].id, q.question, JSON.stringify(q.options), q.correct_answer, q.explanation || '', i + 1]
      );
    }

    res.status(201).json({ quiz_id: quiz.rows[0].id, question_count: questions.length });
  } catch (err) { next(err); }
};

// ──────────────────────────────────────────────
//  AI CHATBOT (Course Assistant)
// ──────────────────────────────────────────────

// POST /api/ai/chat
const chat = async (req, res, next) => {
  try {
    const { message, course_id, lesson_id, history = [] } = req.body;

    if (!message) return res.status(400).json({ error: 'Message required' });

    // Build context from course/lesson content
    let context = '';
    if (lesson_id) {
      const lesson = await query(
        `SELECT l.title, l.content, s.title AS section_title, c.title AS course_title, c.description
         FROM lessons l
         JOIN sections s ON s.id = l.section_id
         JOIN courses c ON c.id = s.course_id
         WHERE l.id = $1`,
        [lesson_id]
      );
      if (lesson.rows.length) {
        const l = lesson.rows[0];
        context = `Course: ${l.course_title}\nDescription: ${l.description}\nSection: ${l.section_title}\nLesson: ${l.title}\n\nLesson Content:\n${l.content || 'No text content'}`;
      }
    } else if (course_id) {
      const course = await query(
        `SELECT c.title, c.description,
          (SELECT string_agg(l.title, ', ' ORDER BY s.sort_order, l.sort_order)
           FROM lessons l JOIN sections s ON s.id = l.section_id WHERE s.course_id = c.id) AS lesson_titles
         FROM courses c WHERE c.id = $1`,
        [course_id]
      );
      if (course.rows.length) {
        const c = course.rows[0];
        context = `Course: ${c.title}\nDescription: ${c.description}\nLessons: ${c.lesson_titles || 'None'}`;
      }
    }

    const systemPrompt = `You are a helpful AI teaching assistant for an online learning platform called "Knowlytics Hub".
Your role is to help students understand course material, answer their questions, and guide their learning.

Rules:
- Answer in the SAME LANGUAGE the student writes in (Arabic or English)
- Be concise but thorough
- Use examples when helpful
- If the question is not related to the course content, politely redirect
- If you're unsure, say so rather than guessing
- Be encouraging and supportive
- Use markdown formatting for clarity

${context ? `\n\nCourse Context:\n${context}` : ''}`;

    // Build messages from history
    const messages = [
      { role: 'system', content: systemPrompt },
      ...history.slice(-8).map((h) => ({ role: h.role, content: h.content })),
      { role: 'user', content: message },
    ];

    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-4o-mini',
        messages,
        temperature: 0.7,
        max_tokens: 1500,
      },
      {
        headers: {
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
        timeout: 30000,
      }
    );

    const reply = response.data.choices[0].message.content;

    res.json({
      reply,
      tokens_used: response.data.usage?.total_tokens || 0,
    });
  } catch (err) {
    console.error('AI Chat error:', err.message);
    if (!OPENAI_API_KEY) {
      return res.status(503).json({ error: 'AI service not configured' });
    }
    next(err);
  }
};

// POST /api/ai/summarize — summarize lesson content
const summarize = async (req, res, next) => {
  try {
    const { lesson_id, language = 'ar' } = req.body;

    const lesson = await query(
      `SELECT l.title, l.content, s.title AS section_title
       FROM lessons l JOIN sections s ON s.id = l.section_id
       WHERE l.id = $1`,
      [lesson_id]
    );
    if (!lesson.rows.length) return res.status(404).json({ error: 'Lesson not found' });

    const l = lesson.rows[0];
    const systemPrompt = `Summarize the following lesson content into key bullet points.
Language: ${language === 'ar' ? 'Arabic' : 'English'}
Keep it concise and focused on the main concepts.
Format: Use markdown bullet points.`;

    const result = await callAI(systemPrompt, `Lesson: ${l.title}\nSection: ${l.section_title}\n\n${l.content || 'No content available'}`);
    res.json({ summary: result });
  } catch (err) {
    if (!OPENAI_API_KEY) return res.status(503).json({ error: 'AI service not configured' });
    next(err);
  }
};

module.exports = { generateQuiz, saveGeneratedQuiz, chat, summarize };
