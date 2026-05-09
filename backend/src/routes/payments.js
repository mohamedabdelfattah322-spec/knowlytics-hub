const express = require('express');
const { authenticate, authorize } = require('../middleware/auth');
const {
  initiatePayment, paymobWebhook, myPayments, listAllPayments, refundPayment, getInvoice,
} = require('../controllers/paymentController');

const router = express.Router();

// Public webhook (verified via HMAC inside the controller)
router.post('/webhook', paymobWebhook);

// Authenticated student
router.post('/initiate', authenticate, initiatePayment);
router.get('/my',        authenticate, myPayments);
router.get('/:id/invoice', authenticate, getInvoice);

// Admin
router.get('/',                   authenticate, authorize('admin'), listAllPayments);
router.post('/:id/refund',        authenticate, authorize('admin'), refundPayment);

module.exports = router;
