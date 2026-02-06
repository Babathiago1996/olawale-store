const express = require('express');
const multer = require('multer');
const itemController = require('../controllers/item.controller');
const { authenticate, authorize, checkPermission } = require('../middleware/auth');

const router = express.Router();

// Configure multer for memory storage
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB
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

// Create item (Admin & Staff)
router.post(
  '/',
  authorize('admin', 'staff'),
  checkPermission('item', 'create'),
  upload.array('images', 5),
  itemController.createItem
);

// Get all items
router.get(
  '/',
  checkPermission('item', 'read'),
  itemController.getAllItems
);

// Search items
router.get(
  '/search',
  checkPermission('item', 'read'),
  itemController.searchItems
);

// Get low stock items
router.get(
  '/low-stock',
  checkPermission('item', 'read'),
  itemController.getLowStockItems
);

// Get inventory statistics
router.get(
  '/statistics',
  checkPermission('item', 'read'),
  itemController.getInventoryStats
);

// Get single item
router.get(
  '/:id',
  checkPermission('item', 'read'),
  itemController.getItemById
);

// Update item
router.patch(
  '/:id',
  authorize('admin', 'staff'),
  checkPermission('item', 'update'),
  itemController.updateItem
);

// Delete item (Admin only)
router.delete(
  '/:id',
  authorize('admin'),
  checkPermission('item', 'delete'),
  itemController.deleteItem
);

// Add images to item
router.post(
  '/:id/images',
  authorize('admin', 'staff'),
  checkPermission('item', 'update'),
  upload.array('images', 5),
  itemController.addImages
);

// Remove image from item
router.delete(
  '/:id/images/:imageId',
  authorize('admin', 'staff'),
  checkPermission('item', 'update'),
  itemController.removeImage
);

// Set primary image
router.patch(
  '/:id/images/:imageId/primary',
  authorize('admin', 'staff'),
  checkPermission('item', 'update'),
  itemController.setPrimaryImage
);

// Restock item
router.post(
  '/:id/restock',
  authorize('admin', 'staff'),
  checkPermission('item', 'restock'),
  itemController.restockItem
);

module.exports = router;