const express = require('express');
const { authenticate, authorize } = require('../middleware/auth');
const {
  initiatePayment, paymobWebhook, myPayments, listAllPayments,
} = require('../controllers/paymentController');

const router = express.Router();

// Public webhook (verified via HMAC inside the controller)
router.post('/webhook', paymobWebhook);

// Authenticated student
router.post('/initiate', authenticate, initiatePayment);
router.get('/my', authenticate, myPayments);

// Admin
router.get('/', authenticate, authorize('admin'), listAllPayments);

module.exports = router;
