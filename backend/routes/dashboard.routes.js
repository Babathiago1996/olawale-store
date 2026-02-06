const express = require('express');
const dashboardController = require('../controllers/dashboard.controller');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Get dashboard overview
router.get(
  '/overview',
  dashboardController.getDashboardOverview
);

// Get sales analytics
router.get(
  '/analytics/sales',
  dashboardController.getSalesAnalytics
);

// Get inventory analytics
router.get(
  '/analytics/inventory',
  dashboardController.getInventoryAnalytics
);

// Get recent activity
router.get(
  '/activity',
  dashboardController.getRecentActivity
);

// Get executive summary (Admin only)
router.get(
  '/executive-summary',
  authorize('admin'),
  dashboardController.getExecutiveSummary
);

module.exports = router;