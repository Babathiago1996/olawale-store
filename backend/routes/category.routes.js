const express = require('express');
const multer = require('multer');
const categoryController = require('../controllers/category.controller');
const { authenticate, authorize, checkPermission } = require('../middleware/auth');

const router = express.Router();

// Configure multer for single image upload
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 3 * 1024 * 1024 // 3MB
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  }
});

// All routes require authentication
router.use(authenticate);

// Create category (Admin and Staff)
router.post(
  '/',
  authorize('admin', 'staff'),
  checkPermission('category', 'create'),
  upload.single('image'),
  categoryController.createCategory
);

// Get all categories
router.get(
  '/',
  checkPermission('category', 'read'),
  categoryController.getAllCategories
);

// Get category statistics
router.get(
  '/statistics',
  checkPermission('category', 'read'),
  categoryController.getCategoryStats
);

// Reorder categories (Admin only)
router.post(
  '/reorder',
  authorize('admin'),
  checkPermission('category', 'update'),
  categoryController.reorderCategories
);

// Get single category
router.get(
  '/:id',
  checkPermission('category', 'read'),
  categoryController.getCategoryById
);

// Get category with items
router.get(
  '/:id/items',
  checkPermission('category', 'read'),
  categoryController.getCategoryWithItems
);

// Update category metadata
router.post(
  '/:id/update-metadata',
  authorize('admin', 'staff'),
  checkPermission('category', 'update'),
  categoryController.updateCategoryMetadata
);

// Update category (Admin only)
router.patch(
  '/:id',
  authorize('admin'),
  checkPermission('category', 'update'),
  upload.single('image'),
  categoryController.updateCategory
);

// Delete category (Admin only)
router.delete(
  '/:id',
  authorize('admin'),
  checkPermission('category', 'delete'),
  categoryController.deleteCategory
);

module.exports = router;