const router = require('express').Router({ mergeParams: true });
const { authenticate, authorize } = require('../middleware/auth');
const { listReviews, createReview, deleteReview, myReview } = require('../controllers/reviewController');

// These routes are mounted at /api/courses/:courseId/reviews
router.get('/', listReviews);
router.post('/', authenticate, createReview);
router.get('/mine', authenticate, myReview);
router.delete('/:id', authenticate, deleteReview);

module.exports = router;
