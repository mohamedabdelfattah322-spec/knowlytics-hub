const router = require('express').Router();
const { authenticate, authorize } = require('../middleware/auth');
const c = require('../controllers/couponController');

router.post('/validate', authenticate, c.validateCoupon);
router.get('/', authenticate, authorize('admin'), c.listCoupons);
router.post('/', authenticate, authorize('admin'), c.createCoupon);
router.patch('/:id', authenticate, authorize('admin'), c.updateCoupon);
router.delete('/:id', authenticate, authorize('admin'), c.deleteCoupon);

module.exports = router;
