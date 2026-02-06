const express = require('express');
const saleController = require('../controllers/sale.controller');
const { authenticate, authorize, checkPermission } = require('../middleware/auth');


const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Create sale
router.post(
  '/',
  authorize('admin', 'staff'),
  checkPermission('sale', 'create'),
  saleController.createSale
);

// Get all sales
router.get(
  '/',
  checkPermission('sale', 'read'),
  saleController.getAllSales
);

// Get sales statistics
router.get(
  '/statistics',
  checkPermission('sale', 'read'),
  saleController.getSalesStats
);

// Get top selling items
router.get(
  '/top-selling',
  checkPermission('sale', 'read'),
  saleController.getTopSellingItems
);

// Get daily sales report
router.get(
  '/reports/daily',
  checkPermission('sale', 'read'),
  saleController.getDailySalesReport
);

// Get monthly sales report
router.get(
  '/reports/monthly',
  checkPermission('sale', 'read'),
  saleController.getMonthlySalesReport
);

// Get sales by payment method
router.get(
  '/payment-methods',
  checkPermission('sale', 'read'),
  saleController.getSalesByPaymentMethod
);

// Get single sale
router.get(
  '/:id',
  checkPermission('sale', 'read'),
  saleController.getSaleById
);

// Cancel sale (Admin only)
router.post(
  '/:id/cancel',
  authorize('admin'),
  checkPermission('sale', 'cancel'),
  saleController.cancelSale
);

// Update payment status
router.patch(
  '/:id/payment',
  authorize('admin', 'staff'),
  checkPermission('sale', 'update'),
  saleController.updatePaymentStatus
);

module.exports = router;