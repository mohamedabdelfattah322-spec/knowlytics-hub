const { query } = require('../config/database');

// GET /api/lessons/:lessonId/topics
const listTopics = async (req, res, next) => {
  try {
    const result = await query(
      'SELECT * FROM lesson_topics WHERE lesson_id = $1 ORDER BY order_index',
      [req.params.lessonId]
    );
    res.json(result.rows);
  } catch (err) { next(err); }
};

// POST /api/lessons/:lessonId/topics (admin)
const createTopic = async (req, res, next) => {
  try {
    const { title, content, order_index, duration_minutes } = req.body;
    const result = await query(
      `INSERT INTO lesson_topics (lesson_id, title, content, order_index, duration_minutes)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [req.params.lessonId, title, content, order_index || 0, duration_minutes || 0]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) { next(err); }
};

// PUT /api/lessons/:lessonId/topics/:id (admin)
const updateTopic = async (req, res, next) => {
  try {
    const { title, content, order_index, duration_minutes } = req.body;
    const result = await query(
      `UPDATE lesson_topics SET
       title = COALESCE($1, title), content = COALESCE($2, content),
       order_index = COALESCE($3, order_index), duration_minutes = COALESCE($4, duration_minutes)
       WHERE id = $5 AND lesson_id = $6 RETURNING *`,
      [title, content, order_index, duration_minutes, req.params.id, req.params.lessonId]
    );
    if (!result.rows.length) return res.status(404).json({ error: 'Topic not found' });
    res.json(result.rows[0]);
  } catch (err) { next(err); }
};

// DELETE /api/lessons/:lessonId/topics/:id (admin)
const deleteTopic = async (req, res, next) => {
  try {
    await query(
      'DELETE FROM lesson_topics WHERE id = $1 AND lesson_id = $2',
      [req.params.id, req.params.lessonId]
    );
    res.json({ message: 'Topic deleted' });
  } catch (err) { next(err); }
};

module.exports = { listTopics, createTopic, updateTopic, deleteTopic };
