const express = require('express');
const alertController = require('../controllers/alert.controller');
const { authenticate, authorize, checkPermission } = require('../middleware/auth');

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Get all alerts
router.get(
  '/',
  checkPermission('alert', 'read'),
  alertController.getAllAlerts
);

// Get unread alerts
router.get(
  '/unread',
  checkPermission('alert', 'read'),
  alertController.getUnreadAlerts
);

// Get unresolved alerts
router.get(
  '/unresolved',
  checkPermission('alert', 'read'),
  alertController.getUnresolvedAlerts
);

// Get critical alerts
router.get(
  '/critical',
  checkPermission('alert', 'read'),
  alertController.getCriticalAlerts
);

// Get alert statistics
router.get(
  '/statistics',
  checkPermission('alert', 'read'),
  alertController.getAlertStats
);

// Get alerts by type
router.get(
  '/type/:type',
  checkPermission('alert', 'read'),
  alertController.getAlertsByType
);

// Get alerts by severity
router.get(
  '/severity/:severity',
  checkPermission('alert', 'read'),
  alertController.getAlertsBySeverity
);

// Mark all as read
router.post(
  '/mark-all-read',
  checkPermission('alert', 'update'),
  alertController.markAllAsRead
);

// Mark multiple as read
router.post(
  '/mark-multiple-read',
  checkPermission('alert', 'update'),
  alertController.markMultipleAsRead
);

// Create manual alert (Admin only)
router.post(
  '/',
  authorize('admin'),
  checkPermission('alert', 'create'),
  alertController.createAlert
);

// Get single alert
router.get(
  '/:id',
  checkPermission('alert', 'read'),
  alertController.getAlertById
);

// Mark as read
router.post(
  '/:id/read',
  checkPermission('alert', 'update'),
  alertController.markAsRead
);

// Resolve alert
router.post(
  '/:id/resolve',
  authorize('admin', 'staff'),
  checkPermission('alert', 'resolve'),
  alertController.resolveAlert
);

// Send notification
router.post(
  '/:id/notify',
  authorize('admin'),
  alertController.sendNotification
);

// Delete alert (Admin only)
router.delete(
  '/:id',
  authorize('admin'),
  checkPermission('alert', 'delete'),
  alertController.deleteAlert
);

// Cleanup old alerts (Admin only)
router.post(
  '/cleanup',
  authorize('admin'),
  alertController.cleanupOldAlerts
);

module.exports = router;