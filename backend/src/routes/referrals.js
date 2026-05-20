const router = require('express').Router();
const { authenticate, authorize } = require('../middleware/auth');
const {
  getMyReferral, applyReferralCode, getMyDiscount, requestPayout,
  getAdminStats, updateSettings, processPayout,
} = require('../controllers/referralController');

// ─── Student ──────────────────────────────────
router.get('/my',           authenticate, getMyReferral);
router.post('/apply',       authenticate, applyReferralCode);
router.get('/discount',     authenticate, getMyDiscount);
router.post('/payout',      authenticate, requestPayout);

// ─── Admin ────────────────────────────────────
router.get('/admin/stats',          authenticate, authorize('admin'), getAdminStats);
router.put('/admin/settings',       authenticate, authorize('admin'), updateSettings);
router.put('/admin/payouts/:id',    authenticate, authorize('admin'), processPayout);

module.exports = router;
