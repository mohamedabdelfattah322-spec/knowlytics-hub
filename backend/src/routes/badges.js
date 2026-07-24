const router = require('express').Router();
const { authenticate } = require('../middleware/auth');
const { listBadges, myBadges, leaderboard, checkAndAward } = require('../controllers/badgeController');

router.get('/', listBadges);
router.get('/my', authenticate, myBadges);
router.get('/leaderboard', leaderboard);
router.post('/check', authenticate, checkAndAward);

module.exports = router;
