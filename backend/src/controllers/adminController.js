const { query } = require('../config/database');
const { revokeAllSessions } = require('../middleware/sessionGuard');

// GET /api/admin/dashboard  — platform-wide stats
const getDashboardStats = async (req, res, next) => {
  try {
    const [users, courses, enrollments, revenue] = await Promise.all([
      query(`SELECT COUNT(*) AS total, COUNT(*) FILTER (WHERE role = 'student') AS students, COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '30 days') AS new_this_month FROM users`),
      query(`SELECT COUNT(*) AS total, COUNT(*) FILTER (WHERE is_published = true) AS published FROM courses`),
      query(`SELECT COUNT(*) AS total, COUNT(*) FILTER (WHERE completed_at IS NOT NULL) AS completed FROM enrollments`),
      query(`SELECT COALESCE(SUM(c.price), 0) AS total FROM enrollments e JOIN courses c ON c.id = e.course_id WHERE e.enrolled_at > NOW() - INTERVAL '30 days'`),
    ]);

    const recentEnrollments = await query(
      `SELECT u.name AS student_name, u.email, c.title AS course_title, e.enrolled_at
       FROM enrollments e JOIN users u ON u.id = e.user_id JOIN courses c ON c.id = e.course_id
       ORDER BY e.enrolled_at DESC LIMIT 10`
    );

    res.json({
      stats: {
        users: users.rows[0],
        courses: courses.rows[0],
        enrollments: enrollments.rows[0],
        monthly_revenue: revenue.rows[0].total,
      },
      recent_enrollments: recentEnrollments.rows,
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/admin/users  — paginated user list with search
const listUsers = async (req, res, next) => {
  try {
    const { search, role, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;
    const params = [];
    const conditions = [];

    if (search) { params.push(`%${search}%`); conditions.push(`(u.name ILIKE $${params.length} OR u.email ILIKE $${params.length})`); }
    if (role) { params.push(role); conditions.push(`u.role = $${params.length}`); }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    params.push(limit, offset);

    const result = await query(
      `SELECT u.id, u.name, u.email, u.role, u.student_type, u.is_active, u.created_at,
              COUNT(DISTINCT e.id) AS enrollment_count
       FROM users u LEFT JOIN enrollments e ON e.user_id = u.id
       ${where} GROUP BY u.id ORDER BY u.created_at DESC
       LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params
    );

    res.json({ users: result.rows });
  } catch (err) {
    next(err);
  }
};

// PATCH /api/admin/users/:id  — toggle active / change role
const updateUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { is_active, role, student_type } = req.body;
    const updates = [];
    const values = [];

    if (is_active !== undefined) { values.push(is_active); updates.push(`is_active = $${values.length}`); }
    if (role) { values.push(role); updates.push(`role = $${values.length}`); }
    if (student_type) { values.push(student_type); updates.push(`student_type = $${values.length}`); }

    if (!updates.length) return res.status(400).json({ error: 'Nothing to update' });

    values.push(id);
    await query(`UPDATE users SET ${updates.join(', ')}, updated_at = NOW() WHERE id = $${values.length}`, values);

    // If suspending, kill all sessions
    if (is_active === false) await revokeAllSessions(id);

    res.json({ message: 'User updated' });
  } catch (err) {
    next(err);
  }
};

// DELETE /api/admin/users/:id
const deleteUser = async (req, res, next) => {
  try {
    await revokeAllSessions(req.params.id);
    await query('DELETE FROM users WHERE id = $1', [req.params.id]);
    res.json({ message: 'User deleted' });
  } catch (err) {
    next(err);
  }
};

// POST /api/admin/sections  — create course section
const createSection = async (req, res, next) => {
  try {
    const { course_id, title, description, order_index } = req.body;
    const result = await query(
      `INSERT INTO sections (course_id, title, description, order_index) VALUES ($1, $2, $3, $4) RETURNING *`,
      [course_id, title, description || null, order_index]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    next(err);
  }
};

// PUT /api/admin/sections/:id
const updateSection = async (req, res, next) => {
  try {
    const { title, description, order_index } = req.body;
    const result = await query(
      `UPDATE sections SET
         title = COALESCE($1, title),
         description = COALESCE($2, description),
         order_index = COALESCE($3, order_index)
       WHERE id = $4 RETURNING *`,
      [title, description, order_index, req.params.id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    next(err);
  }
};

// DELETE /api/admin/sections/:id
const deleteSection = async (req, res, next) => {
  try {
    await query('DELETE FROM sections WHERE id = $1', [req.params.id]);
    res.json({ message: 'Section deleted' });
  } catch (err) {
    next(err);
  }
};

// GET /api/admin/sessions  — active session monitor
const listActiveSessions = async (req, res, next) => {
  try {
    const result = await query(
      `SELECT s.id, s.device_id, s.ip_address, s.created_at, u.name, u.email
       FROM sessions s JOIN users u ON u.id = s.user_id
       WHERE s.is_active = true ORDER BY s.created_at DESC LIMIT 100`
    );
    res.json(result.rows);
  } catch (err) {
    next(err);
  }
};

module.exports = { getDashboardStats, listUsers, updateUser, deleteUser, createSection, updateSection, deleteSection, listActiveSessions };
