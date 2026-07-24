const router = require('express').Router();
const { authenticate, authorize } = require('../middleware/auth');
const { createTeam, myTeams, getTeam, addMember, removeMember, assignCourse, unassignCourse, allTeams } = require('../controllers/teamController');

router.get('/all', authenticate, authorize('admin'), allTeams);
router.get('/', authenticate, myTeams);
router.post('/', authenticate, createTeam);
router.get('/:id', authenticate, getTeam);
router.post('/:id/members', authenticate, addMember);
router.delete('/:id/members/:userId', authenticate, removeMember);
router.post('/:id/assignments', authenticate, assignCourse);
router.delete('/:id/assignments/:courseId', authenticate, unassignCourse);

module.exports = router;
