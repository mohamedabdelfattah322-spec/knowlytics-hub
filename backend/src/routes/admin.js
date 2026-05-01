const router = require('express').Router();
const { authenticate, authorize } = require('../middleware/auth');
const {
  getDashboardStats, listUsers, updateUser, deleteUser,
  createSection, updateSection, deleteSection, listActiveSessions,
} = require('../controllers/adminController');

const guard = [authenticate, authorize('admin')];

router.get('/dashboard', ...guard, getDashboardStats);
router.get('/users', ...guard, listUsers);
router.patch('/users/:id', ...guard, updateUser);
router.delete('/users/:id', ...guard, deleteUser);
router.post('/sections', ...guard, createSection);
router.put('/sections/:id', ...guard, updateSection);
router.delete('/sections/:id', ...guard, deleteSection);
router.get('/sessions', ...guard, listActiveSessions);

// Quick student list for enrollment dropdown
router.get('/students', ...guard, async (req, res, next) => {
  try {
    const { query } = require('../config/database');
    const { search = '' } = req.query;
    const result = await query(
      `SELECT id, name, email FROM users
       WHERE role = 'student'
       AND (name ILIKE $1 OR email ILIKE $1)
       ORDER BY name LIMIT 50`,
      [`%${search}%`]
    );
    res.json(result.rows);
  } catch (err) { next(err); }
});

module.exports = router;
