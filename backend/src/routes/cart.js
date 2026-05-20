const router = require('express').Router();
const { authenticate } = require('../middleware/auth');
const { getCart, addToCart, removeFromCart, clearCart } = require('../controllers/cartController');

router.get('/', authenticate, getCart);
router.post('/', authenticate, addToCart);
router.delete('/clear', authenticate, clearCart);
router.delete('/:id', authenticate, removeFromCart);

module.exports = router;
