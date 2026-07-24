const { query } = require('../config/database');

// GET /api/calendar — user's events + global events
const listEvents = async (req, res, next) => {
  try {
    const { start, end, course_id } = req.query;
    const params = [req.user.user_id];
    const conditions = ['(ce.user_id = $1 OR ce.is_global = true)'];

    if (start) { params.push(start); conditions.push(`ce.start_at >= $${params.length}`); }
    if (end) { params.push(end); conditions.push(`ce.start_at <= $${params.length}`); }
    if (course_id) { params.push(course_id); conditions.push(`ce.course_id = $${params.length}`); }

    const result = await query(
      `SELECT ce.*, c.title AS course_title
       FROM calendar_events ce
       LEFT JOIN courses c ON c.id = ce.course_id
       WHERE ${conditions.join(' AND ')}
       ORDER BY ce.start_at`,
      params
    );
    res.json(result.rows);
  } catch (err) { next(err); }
};

// POST /api/calendar
const createEvent = async (req, res, next) => {
  try {
    const { title, description, event_type, start_at, end_at, course_id, is_global } = req.body;

    // Only admin can create global events
    const globalFlag = req.user.role === 'admin' ? (is_global || false) : false;

    const result = await query(
      `INSERT INTO calendar_events (user_id, title, description, event_type, start_at, end_at, course_id, is_global)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [req.user.user_id, title, description, event_type || 'custom', start_at, end_at, course_id, globalFlag]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) { next(err); }
};

// PUT /api/calendar/:id
const updateEvent = async (req, res, next) => {
  try {
    const { title, description, event_type, start_at, end_at, course_id } = req.body;
    const result = await query(
      `UPDATE calendar_events SET
       title = COALESCE($1, title), description = COALESCE($2, description),
       event_type = COALESCE($3, event_type), start_at = COALESCE($4, start_at),
       end_at = COALESCE($5, end_at), course_id = $6
       WHERE id = $7 AND (user_id = $8 OR $9 = 'admin')
       RETURNING *`,
      [title, description, event_type, start_at, end_at, course_id, req.params.id, req.user.user_id, req.user.role]
    );
    if (!result.rows.length) return res.status(404).json({ error: 'Event not found' });
    res.json(result.rows[0]);
  } catch (err) { next(err); }
};

// DELETE /api/calendar/:id
const deleteEvent = async (req, res, next) => {
  try {
    await query(
      "DELETE FROM calendar_events WHERE id = $1 AND (user_id = $2 OR $3 = 'admin')",
      [req.params.id, req.user.user_id, req.user.role]
    );
    res.json({ message: 'Event deleted' });
  } catch (err) { next(err); }
};

module.exports = { listEvents, createEvent, updateEvent, deleteEvent };
