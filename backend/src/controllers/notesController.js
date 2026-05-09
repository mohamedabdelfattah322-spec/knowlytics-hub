const { query } = require('../config/database');

// ─── GET /api/notes/lesson/:lessonId  ─────────────────────
const getNotes = async (req, res, next) => {
  try {
    const result = await query(
      `SELECT * FROM lesson_notes
       WHERE user_id = $1 AND lesson_id = $2
       ORDER BY video_timestamp ASC`,
      [req.user.user_id, req.params.lessonId]
    );
    res.json(result.rows);
  } catch (err) { next(err); }
};

// ─── POST /api/notes/lesson/:lessonId  ────────────────────
const createNote = async (req, res, next) => {
  try {
    const { content, video_timestamp = 0 } = req.body;
    if (!content?.trim()) return res.status(400).json({ error: 'Content required' });
    const result = await query(
      `INSERT INTO lesson_notes (user_id, lesson_id, content, video_timestamp)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [req.user.user_id, req.params.lessonId, content.trim(), video_timestamp]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) { next(err); }
};

// ─── PUT /api/notes/:id  ──────────────────────────────────
const updateNote = async (req, res, next) => {
  try {
    const { content } = req.body;
    const result = await query(
      `UPDATE lesson_notes
       SET content = $1, updated_at = NOW()
       WHERE id = $2 AND user_id = $3
       RETURNING *`,
      [content, req.params.id, req.user.user_id]
    );
    if (!result.rows.length) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) { next(err); }
};

// ─── DELETE /api/notes/:id  ───────────────────────────────
const deleteNote = async (req, res, next) => {
  try {
    await query(
      `DELETE FROM lesson_notes WHERE id = $1 AND user_id = $2`,
      [req.params.id, req.user.user_id]
    );
    res.json({ ok: true });
  } catch (err) { next(err); }
};

// ─── GET /api/notes/my-all  (all notes across courses) ────
const getAllMyNotes = async (req, res, next) => {
  try {
    const result = await query(
      `SELECT n.*, l.title AS lesson_title, s.title AS section_title,
              c.id AS course_id, c.title AS course_title
       FROM lesson_notes n
       JOIN lessons l ON l.id = n.lesson_id
       JOIN sections s ON s.id = l.section_id
       JOIN courses c ON c.id = s.course_id
       WHERE n.user_id = $1
       ORDER BY n.created_at DESC`,
      [req.user.user_id]
    );
    res.json(result.rows);
  } catch (err) { next(err); }
};

// ─── GET /api/notes/bookmarks/lesson/:lessonId  ───────────
const getBookmarks = async (req, res, next) => {
  try {
    const result = await query(
      `SELECT * FROM lesson_bookmarks
       WHERE user_id = $1 AND lesson_id = $2
       ORDER BY video_timestamp ASC`,
      [req.user.user_id, req.params.lessonId]
    );
    res.json(result.rows);
  } catch (err) { next(err); }
};

// ─── POST /api/notes/bookmarks/lesson/:lessonId  ──────────
const addBookmark = async (req, res, next) => {
  try {
    const { video_timestamp = 0, label } = req.body;
    const result = await query(
      `INSERT INTO lesson_bookmarks (user_id, lesson_id, video_timestamp, label)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (user_id, lesson_id, video_timestamp)
       DO UPDATE SET label = EXCLUDED.label
       RETURNING *`,
      [req.user.user_id, req.params.lessonId, video_timestamp, label || null]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) { next(err); }
};

// ─── DELETE /api/notes/bookmarks/:id  ─────────────────────
const deleteBookmark = async (req, res, next) => {
  try {
    await query(
      `DELETE FROM lesson_bookmarks WHERE id = $1 AND user_id = $2`,
      [req.params.id, req.user.user_id]
    );
    res.json({ ok: true });
  } catch (err) { next(err); }
};

// ─── GET /api/notes/bookmarks/my-all  ─────────────────────
const getAllMyBookmarks = async (req, res, next) => {
  try {
    const result = await query(
      `SELECT b.*, l.title AS lesson_title, c.id AS course_id, c.title AS course_title
       FROM lesson_bookmarks b
       JOIN lessons l ON l.id = b.lesson_id
       JOIN sections s ON s.id = l.section_id
       JOIN courses c ON c.id = s.course_id
       WHERE b.user_id = $1
       ORDER BY b.created_at DESC`,
      [req.user.user_id]
    );
    res.json(result.rows);
  } catch (err) { next(err); }
};

module.exports = {
  getNotes, createNote, updateNote, deleteNote, getAllMyNotes,
  getBookmarks, addBookmark, deleteBookmark, getAllMyBookmarks,
};
