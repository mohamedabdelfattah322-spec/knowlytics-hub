const express = require('express');
const { authenticate, authorize } = require('../middleware/auth');
const {
  initiatePayment, paymobWebhook, stripeWebhook,
  getPaymentMethods, myPayments, listAllPayments, refundPayment, getInvoice,
} = require('../controllers/paymentController');

const router = express.Router();

// Public: list available payment methods (so frontend can show toggles)
router.get('/methods', getPaymentMethods);

// Public webhooks (verified inside controllers)
router.post('/webhook', paymobWebhook);
// Stripe webhook is mounted in app.js with raw body parser

// Authenticated student
router.post('/initiate', authenticate, initiatePayment);
router.get('/my',        authenticate, myPayments);
router.get('/:id/invoice', authenticate, getInvoice);

// Admin
router.get('/',            authenticate, authorize('admin'), listAllPayments);
router.post('/:id/refund', authenticate, authorize('admin'), refundPayment);

module.exports = router;
module.exports.stripeWebhook = stripeWebhook;
