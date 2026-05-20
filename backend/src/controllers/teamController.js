const { query } = require('../config/database');

// ─── Teams CRUD ──────────────────────────────────────────

// POST /api/teams
const createTeam = async (req, res, next) => {
  try {
    const { name, logo_url, max_members } = req.body;
    const result = await query(
      `INSERT INTO teams (name, owner_id, logo_url, max_members)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [name, req.user.user_id, logo_url, max_members || 50]
    );
    // Add owner as team member
    await query(
      `INSERT INTO team_members (team_id, user_id, role) VALUES ($1, $2, 'owner')`,
      [result.rows[0].id, req.user.user_id]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) { next(err); }
};

// GET /api/teams — user's teams
const myTeams = async (req, res, next) => {
  try {
    const result = await query(
      `SELECT t.*, tm.role AS my_role,
              COUNT(DISTINCT tm2.id)::int AS member_count
       FROM team_members tm
       JOIN teams t ON t.id = tm.team_id
       LEFT JOIN team_members tm2 ON tm2.team_id = t.id
       WHERE tm.user_id = $1
       GROUP BY t.id, tm.role
       ORDER BY t.created_at DESC`,
      [req.user.user_id]
    );
    res.json(result.rows);
  } catch (err) { next(err); }
};

// GET /api/teams/:id
const getTeam = async (req, res, next) => {
  try {
    const team = await query('SELECT * FROM teams WHERE id = $1', [req.params.id]);
    if (!team.rows.length) return res.status(404).json({ error: 'Team not found' });

    const members = await query(
      `SELECT tm.*, u.name, u.email, u.avatar_url
       FROM team_members tm
       JOIN users u ON u.id = tm.user_id
       WHERE tm.team_id = $1
       ORDER BY tm.role, tm.joined_at`,
      [req.params.id]
    );

    const assignments = await query(
      `SELECT tca.*, c.title AS course_title, c.thumbnail_url,
              u.name AS assigned_by_name
       FROM team_course_assignments tca
       JOIN courses c ON c.id = tca.course_id
       LEFT JOIN users u ON u.id = tca.assigned_by
       WHERE tca.team_id = $1
       ORDER BY tca.assigned_at DESC`,
      [req.params.id]
    );

    res.json({
      team: team.rows[0],
      members: members.rows,
      assignments: assignments.rows,
    });
  } catch (err) { next(err); }
};

// POST /api/teams/:id/members — add member
const addMember = async (req, res, next) => {
  try {
    const { user_id, email, role = 'member' } = req.body;

    // Find user by ID or email
    let targetId = user_id;
    if (!targetId && email) {
      const u = await query('SELECT id FROM users WHERE email = $1', [email]);
      if (!u.rows.length) return res.status(404).json({ error: 'User not found' });
      targetId = u.rows[0].id;
    }

    // Check team capacity
    const team = await query('SELECT max_members FROM teams WHERE id = $1', [req.params.id]);
    const memberCount = await query('SELECT COUNT(*)::int AS c FROM team_members WHERE team_id = $1', [req.params.id]);
    if (memberCount.rows[0].c >= (team.rows[0]?.max_members || 50)) {
      return res.status(400).json({ error: 'الفريق وصل للحد الأقصى من الأعضاء' });
    }

    const result = await query(
      `INSERT INTO team_members (team_id, user_id, role)
       VALUES ($1, $2, $3)
       ON CONFLICT (team_id, user_id) DO NOTHING
       RETURNING *`,
      [req.params.id, targetId, role]
    );
    res.status(201).json(result.rows[0] || { message: 'Already a member' });
  } catch (err) { next(err); }
};

// DELETE /api/teams/:id/members/:userId
const removeMember = async (req, res, next) => {
  try {
    await query(
      'DELETE FROM team_members WHERE team_id = $1 AND user_id = $2',
      [req.params.id, req.params.userId]
    );
    res.json({ message: 'Member removed' });
  } catch (err) { next(err); }
};

// POST /api/teams/:id/assignments — assign course to team
const assignCourse = async (req, res, next) => {
  try {
    const { course_id, deadline } = req.body;
    const result = await query(
      `INSERT INTO team_course_assignments (team_id, course_id, assigned_by, deadline)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (team_id, course_id) DO UPDATE SET deadline = EXCLUDED.deadline
       RETURNING *`,
      [req.params.id, course_id, req.user.user_id, deadline]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) { next(err); }
};

// DELETE /api/teams/:id/assignments/:courseId
const unassignCourse = async (req, res, next) => {
  try {
    await query(
      'DELETE FROM team_course_assignments WHERE team_id = $1 AND course_id = $2',
      [req.params.id, req.params.courseId]
    );
    res.json({ message: 'Course unassigned' });
  } catch (err) { next(err); }
};

// GET /api/teams/all — admin: all teams
const allTeams = async (req, res, next) => {
  try {
    const result = await query(
      `SELECT t.*, u.name AS owner_name,
              COUNT(DISTINCT tm.id)::int AS member_count
       FROM teams t
       JOIN users u ON u.id = t.owner_id
       LEFT JOIN team_members tm ON tm.team_id = t.id
       GROUP BY t.id, u.name
       ORDER BY t.created_at DESC`
    );
    res.json(result.rows);
  } catch (err) { next(err); }
};

module.exports = { createTeam, myTeams, getTeam, addMember, removeMember, assignCourse, unassignCourse, allTeams };
