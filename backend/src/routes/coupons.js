const router = require('express').Router();
const { authenticate, authorize } = require('../middleware/auth');
const c = require('../controllers/couponController');

router.post('/validate', authenticate, c.validateCoupon);
router.get('/admin/cart-analytics', authenticate, authorize('admin'), c.getCartAnalytics);
router.get('/', authenticate, authorize('admin'), c.listCoupons);
router.post('/', authenticate, authorize('admin'), c.createCoupon);
router.get('/:id/redemptions', authenticate, authorize('admin'), c.getCouponRedemptions);
router.patch('/:id', authenticate, authorize('admin'), c.updateCoupon);
router.delete('/:id', authenticate, authorize('admin'), c.deleteCoupon);

module.exports = router;
