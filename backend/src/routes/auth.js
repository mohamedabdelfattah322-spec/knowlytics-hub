const router = require('express').Router();
const rateLimit = require('express-rate-limit');
const { authenticate } = require('../middleware/auth');
const { ipGuard } = require('../middleware/sessionGuard');
const {
  register, login, logout, me, changePassword,
  forgotPassword, resetPassword,
} = require('../controllers/authController');

// Brute-force protection: max 5 login attempts per 15 min per IP
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { error: 'Too many login attempts. Please try again in 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
});

router.post('/register', register);
router.post('/login', loginLimiter, login);
router.post('/logout', authenticate, logout);
router.get('/me', authenticate, ipGuard, me);
router.put('/change-password', authenticate, changePassword);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

module.exports = router;
