const { query } = require('../config/database');

// ──────────────────────────────────────────────
//  THREADS
// ──────────────────────────────────────────────

// GET /api/discussions/course/:courseId
const getThreads = async (req, res, next) => {
  try {
    const { courseId } = req.params;
    const { lesson_id, sort = 'recent', page = 1, limit = 20 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    let where = 'WHERE dt.course_id = $1';
    const params = [courseId];
    let idx = 2;

    if (lesson_id) {
      where += ` AND dt.lesson_id = $${idx++}`;
      params.push(lesson_id);
    }

    const orderBy = sort === 'popular' ? 'dt.upvotes DESC, dt.last_activity_at DESC'
                  : sort === 'unanswered' ? 'dt.is_resolved ASC, dt.last_activity_at DESC'
                  : 'dt.is_pinned DESC, dt.last_activity_at DESC';

    const result = await query(
      `SELECT dt.*, u.name AS author_name, u.role AS author_role,
        l.title AS lesson_title,
        (SELECT COUNT(*) FROM discussion_votes dv WHERE dv.thread_id = dt.id AND dv.user_id = $${idx}) AS my_vote
       FROM discussion_threads dt
       JOIN users u ON u.id = dt.user_id
       LEFT JOIN lessons l ON l.id = dt.lesson_id
       ${where}
       ORDER BY ${orderBy}
       LIMIT $${idx + 1} OFFSET $${idx + 2}`,
      [...params, req.user.user_id, parseInt(limit), offset]
    );

    const countResult = await query(
      `SELECT COUNT(*) FROM discussion_threads dt ${where}`,
      params
    );

    res.json({
      threads: result.rows,
      total: parseInt(countResult.rows[0].count),
      page: parseInt(page),
      pages: Math.ceil(parseInt(countResult.rows[0].count) / parseInt(limit)),
    });
  } catch (err) { next(err); }
};

// GET /api/discussions/thread/:id
const getThread = async (req, res, next) => {
  try {
    const { id } = req.params;

    const thread = await query(
      `SELECT dt.*, u.name AS author_name, u.role AS author_role,
        l.title AS lesson_title, c.title AS course_title,
        (SELECT COUNT(*) FROM discussion_votes dv WHERE dv.thread_id = dt.id AND dv.user_id = $2) AS my_vote
       FROM discussion_threads dt
       JOIN users u ON u.id = dt.user_id
       LEFT JOIN lessons l ON l.id = dt.lesson_id
       JOIN courses c ON c.id = dt.course_id
       WHERE dt.id = $1`,
      [id, req.user.user_id]
    );
    if (!thread.rows.length) return res.status(404).json({ error: 'Thread not found' });

    const replies = await query(
      `SELECT dr.*, u.name AS author_name, u.role AS author_role,
        (SELECT COUNT(*) FROM discussion_votes dv WHERE dv.reply_id = dr.id AND dv.user_id = $2) AS my_vote
       FROM discussion_replies dr
       JOIN users u ON u.id = dr.user_id
       WHERE dr.thread_id = $1
       ORDER BY dr.is_answer DESC, dr.upvotes DESC, dr.created_at ASC`,
      [id, req.user.user_id]
    );

    res.json({ thread: thread.rows[0], replies: replies.rows });
  } catch (err) { next(err); }
};

// POST /api/discussions/course/:courseId
const createThread = async (req, res, next) => {
  try {
    const { courseId } = req.params;
    const { title, body, lesson_id } = req.body;

    if (!title || !body) return res.status(400).json({ error: 'Title and body required' });

    // Verify enrollment or admin
    if (req.user.role !== 'admin') {
      const enrolled = await query(
        'SELECT 1 FROM enrollments WHERE user_id = $1 AND course_id = $2 AND is_active = true',
        [req.user.user_id, courseId]
      );
      if (!enrolled.rows.length) return res.status(403).json({ error: 'Must be enrolled' });
    }

    const result = await query(
      `INSERT INTO discussion_threads (course_id, lesson_id, user_id, title, body)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [courseId, lesson_id || null, req.user.user_id, title, body]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) { next(err); }
};

// PUT /api/discussions/thread/:id
const updateThread = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { title, body } = req.body;

    const thread = await query('SELECT user_id FROM discussion_threads WHERE id = $1', [id]);
    if (!thread.rows.length) return res.status(404).json({ error: 'Not found' });
    if (thread.rows[0].user_id !== req.user.user_id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Not authorized' });
    }

    const result = await query(
      `UPDATE discussion_threads SET title = COALESCE($1, title), body = COALESCE($2, body), updated_at = NOW()
       WHERE id = $3 RETURNING *`,
      [title, body, id]
    );
    res.json(result.rows[0]);
  } catch (err) { next(err); }
};

// DELETE /api/discussions/thread/:id
const deleteThread = async (req, res, next) => {
  try {
    const { id } = req.params;
    const thread = await query('SELECT user_id FROM discussion_threads WHERE id = $1', [id]);
    if (!thread.rows.length) return res.status(404).json({ error: 'Not found' });
    if (thread.rows[0].user_id !== req.user.user_id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Not authorized' });
    }
    await query('DELETE FROM discussion_threads WHERE id = $1', [id]);
    res.json({ message: 'Deleted' });
  } catch (err) { next(err); }
};

// PUT /api/discussions/thread/:id/pin — admin only
const pinThread = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await query(
      'UPDATE discussion_threads SET is_pinned = NOT is_pinned WHERE id = $1 RETURNING is_pinned',
      [id]
    );
    res.json({ is_pinned: result.rows[0]?.is_pinned });
  } catch (err) { next(err); }
};

// PUT /api/discussions/thread/:id/resolve
const resolveThread = async (req, res, next) => {
  try {
    const { id } = req.params;
    const thread = await query('SELECT user_id FROM discussion_threads WHERE id = $1', [id]);
    if (thread.rows[0]?.user_id !== req.user.user_id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Not authorized' });
    }
    const result = await query(
      'UPDATE discussion_threads SET is_resolved = NOT is_resolved WHERE id = $1 RETURNING is_resolved',
      [id]
    );
    res.json({ is_resolved: result.rows[0]?.is_resolved });
  } catch (err) { next(err); }
};

// ──────────────────────────────────────────────
//  REPLIES
// ──────────────────────────────────────────────

// POST /api/discussions/thread/:id/reply
const createReply = async (req, res, next) => {
  try {
    const { id } = req.params; // thread_id
    const { body, parent_id } = req.body;

    if (!body) return res.status(400).json({ error: 'Body required' });

    const result = await query(
      `INSERT INTO discussion_replies (thread_id, user_id, parent_id, body)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [id, req.user.user_id, parent_id || null, body]
    );

    // Update thread reply count & last activity
    await query(
      `UPDATE discussion_threads SET reply_count = reply_count + 1, last_activity_at = NOW()
       WHERE id = $1`,
      [id]
    );

    // Get author info for response
    const reply = await query(
      `SELECT dr.*, u.name AS author_name, u.role AS author_role
       FROM discussion_replies dr JOIN users u ON u.id = dr.user_id
       WHERE dr.id = $1`,
      [result.rows[0].id]
    );

    res.status(201).json(reply.rows[0]);
  } catch (err) { next(err); }
};

// PUT /api/discussions/reply/:id
const updateReply = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { body } = req.body;

    const reply = await query('SELECT user_id FROM discussion_replies WHERE id = $1', [id]);
    if (!reply.rows.length) return res.status(404).json({ error: 'Not found' });
    if (reply.rows[0].user_id !== req.user.user_id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Not authorized' });
    }

    const result = await query(
      'UPDATE discussion_replies SET body = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
      [body, id]
    );
    res.json(result.rows[0]);
  } catch (err) { next(err); }
};

// DELETE /api/discussions/reply/:id
const deleteReply = async (req, res, next) => {
  try {
    const { id } = req.params;
    const reply = await query('SELECT user_id, thread_id FROM discussion_replies WHERE id = $1', [id]);
    if (!reply.rows.length) return res.status(404).json({ error: 'Not found' });
    if (reply.rows[0].user_id !== req.user.user_id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Not authorized' });
    }
    await query('DELETE FROM discussion_replies WHERE id = $1', [id]);
    await query(
      'UPDATE discussion_threads SET reply_count = GREATEST(reply_count - 1, 0) WHERE id = $1',
      [reply.rows[0].thread_id]
    );
    res.json({ message: 'Deleted' });
  } catch (err) { next(err); }
};

// PUT /api/discussions/reply/:id/answer — mark as answer (admin/instructor)
const markAsAnswer = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await query(
      'UPDATE discussion_replies SET is_answer = NOT is_answer WHERE id = $1 RETURNING is_answer, thread_id',
      [id]
    );
    // Auto-resolve thread when answer is marked
    if (result.rows[0]?.is_answer) {
      await query('UPDATE discussion_threads SET is_resolved = true WHERE id = $1', [result.rows[0].thread_id]);
    }
    res.json({ is_answer: result.rows[0]?.is_answer });
  } catch (err) { next(err); }
};

// ──────────────────────────────────────────────
//  VOTES
// ──────────────────────────────────────────────

// POST /api/discussions/vote
const vote = async (req, res, next) => {
  try {
    const { thread_id, reply_id } = req.body;
    const userId = req.user.user_id;

    if (thread_id) {
      const existing = await query(
        'SELECT 1 FROM discussion_votes WHERE user_id = $1 AND thread_id = $2', [userId, thread_id]
      );
      if (existing.rows.length) {
        await query('DELETE FROM discussion_votes WHERE user_id = $1 AND thread_id = $2', [userId, thread_id]);
        await query('UPDATE discussion_threads SET upvotes = GREATEST(upvotes - 1, 0) WHERE id = $1', [thread_id]);
        return res.json({ voted: false });
      }
      await query('INSERT INTO discussion_votes (user_id, thread_id) VALUES ($1, $2)', [userId, thread_id]);
      await query('UPDATE discussion_threads SET upvotes = upvotes + 1 WHERE id = $1', [thread_id]);
      return res.json({ voted: true });
    }

    if (reply_id) {
      const existing = await query(
        'SELECT 1 FROM discussion_votes WHERE user_id = $1 AND reply_id = $2', [userId, reply_id]
      );
      if (existing.rows.length) {
        await query('DELETE FROM discussion_votes WHERE user_id = $1 AND reply_id = $2', [userId, reply_id]);
        await query('UPDATE discussion_replies SET upvotes = GREATEST(upvotes - 1, 0) WHERE id = $1', [reply_id]);
        return res.json({ voted: false });
      }
      await query('INSERT INTO discussion_votes (user_id, reply_id) VALUES ($1, $2)', [userId, reply_id]);
      await query('UPDATE discussion_replies SET upvotes = upvotes + 1 WHERE id = $1', [reply_id]);
      return res.json({ voted: true });
    }

    res.status(400).json({ error: 'thread_id or reply_id required' });
  } catch (err) { next(err); }
};

module.exports = {
  getThreads, getThread, createThread, updateThread, deleteThread,
  pinThread, resolveThread,
  createReply, updateReply, deleteReply, markAsAnswer,
  vote,
};
