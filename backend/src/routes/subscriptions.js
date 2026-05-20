const router = require('express').Router();
const { authenticate, authorize } = require('../middleware/auth');
const { listPlans, listAllPlans, createPlan, updatePlan, mySubscription, subscribe, cancelSubscription } = require('../controllers/subscriptionController');

router.get('/plans', listPlans);
router.get('/plans/all', authenticate, authorize('admin'), listAllPlans);
router.post('/plans', authenticate, authorize('admin'), createPlan);
router.put('/plans/:id', authenticate, authorize('admin'), updatePlan);
router.get('/my', authenticate, mySubscription);
router.post('/subscribe', authenticate, subscribe);
router.post('/cancel', authenticate, cancelSubscription);

module.exports = router;
