const router = require('express').Router();
const { authenticate, authorize } = require('../middleware/auth');
const c = require('../controllers/bundleController');

// Optional-auth wrapper: try authenticate, but continue even if no token
const optionalAuth = (req, res, next) => {
  if (!req.headers.authorization) return next();
  authenticate(req, res, (err) => { if (err) return next(); next(); });
};

router.get('/', optionalAuth, c.listBundles);
router.get('/my', authenticate, c.myBundles);
router.get('/:id', c.getBundle);

router.post('/', authenticate, authorize('admin'), c.createBundle);
router.patch('/:id', authenticate, authorize('admin'), c.updateBundle);
router.delete('/:id', authenticate, authorize('admin'), c.deleteBundle);

module.exports = router;
