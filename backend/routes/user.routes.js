const express = require('express');
const multer = require('multer');
const userController = require('../controllers/user.controller');
const { authenticate, authorize, checkPermission, checkOwnership } = require('../middleware/auth');

const router = express.Router();

// Configure multer for profile image upload
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 2 * 1024 * 1024 // 2MB
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

// Get all users (Admin only)
router.get(
  '/',
  authorize('admin'),
  checkPermission('user', 'read'),
  userController.getAllUsers
);

// Get user statistics (Admin only)
router.get(
  '/statistics',
  authorize('admin'),
  checkPermission('user', 'read'),
  userController.getUserStats
);

// Get users by role (Admin only)
router.get(
  '/role/:role',
  authorize('admin'),
  checkPermission('user', 'read'),
  userController.getUsersByRole
);

// Update own profile
router.patch(
  '/profile',
  upload.single('profileImage'),
  userController.updateProfile
);

// Deactivate own account
router.post(
  '/deactivate',
  userController.deactivateAccount
);

// Get own activity
router.get(
  '/activity/me',
  userController.getUserActivity
);

// Get user by ID (Admin only)
router.get(
  '/:id',
  authorize('admin'),
  checkPermission('user', 'read'),
  userController.getUserById
);

// Get user activity (Admin only)
router.get(
  '/:id/activity',
  authorize('admin'),
  checkPermission('user', 'read'),
  userController.getUserActivity
);

// Update user (Admin only)
router.patch(
  '/:id',
  authorize('admin'),
  checkPermission('user', 'update'),
  userController.updateUser
);

// Delete user (Admin only)
router.delete(
  '/:id',
  authorize('admin'),
  checkPermission('user', 'delete'),
  userController.deleteUser
);

// Change user role (Admin only)
router.patch(
  '/:id/role',
  authorize('admin'),
  checkPermission('user', 'update'),
  userController.changeUserRole
);

// Reactivate user (Admin only)
router.post(
  '/:id/reactivate',
  authorize('admin'),
  checkPermission('user', 'update'),
  userController.reactivateAccount
);

module.exports = router;