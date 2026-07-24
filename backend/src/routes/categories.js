const router = require('express').Router();
const { authenticate, authorize } = require('../middleware/auth');
const { listCategories, getCategory, createCategory, updateCategory, deleteCategory } = require('../controllers/categoryController');

router.get('/', listCategories);
router.get('/:id', getCategory);
router.post('/', authenticate, authorize('admin'), createCategory);
router.put('/:id', authenticate, authorize('admin'), updateCategory);
router.delete('/:id', authenticate, authorize('admin'), deleteCategory);

module.exports = router;
