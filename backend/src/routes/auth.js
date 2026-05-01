const router = require('express').Router();
const { authenticate } = require('../middleware/auth');
const { ipGuard } = require('../middleware/sessionGuard');
const { register, login, logout, me, changePassword } = require('../controllers/authController');

router.post('/register', register);
router.post('/login', login);
router.post('/logout', authenticate, logout);
router.get('/me', authenticate, ipGuard, me);
router.put('/change-password', authenticate, changePassword);

module.exports = router;
