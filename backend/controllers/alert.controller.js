const { Alert, AuditLog } = require('../models');
const { AppError, asyncHandler } = require('../utils/AppError');
const emailService = require('../services/email.service');

/**
 * Get all alerts
 */
exports.getAllAlerts = asyncHandler(async (req, res, next) => {
  const {
    page = 1,
    limit = 20,
    type,
    severity,
    isRead,
    isResolved,
    sortBy = 'createdAt',
    order = 'desc'
  } = req.query;

  const query = {};

  if (type) query.type = type;
  if (severity) query.severity = severity;
  if (isRead !== undefined) query.isRead = isRead === 'true';
  if (isResolved !== undefined) query.isResolved = isResolved === 'true';

  const sort = {};
  sort[sortBy] = order === 'asc' ? 1 : -1;

  const skip = (Number(page) - 1) * Number(limit);
  
  const [alerts, total] = await Promise.all([
    Alert.find(query)
      .populate({
        path: 'item',
        select: 'name sku stockQuantity lowStockThreshold images unit'
      })
      .populate('user', 'firstName lastName email')
      .populate('resolvedBy', 'firstName lastName')
      .sort(sort)
      .skip(skip)
      .limit(Number(limit))
      .lean(),
    Alert.countDocuments(query)
  ]);

  res.json({
    status: 'success',
    results: alerts.length,
    pagination: {
      page: Number(page),
      limit: Number(limit),
      total,
      pages: Math.ceil(total / Number(limit))
    },
    data: {
      alerts
    }
  });
});

/**
 * Get unread alerts
 */
exports.getUnreadAlerts = asyncHandler(async (req, res, next) => {
  try {
    const alerts = await Alert.find({ 
      isRead: false, 
      isResolved: false 
    })
      .populate({
        path: 'item',
        select: 'name sku stockQuantity lowStockThreshold images unit'
      })
      .populate('user', 'firstName lastName email')
      .sort({ severity: -1, createdAt: -1 })
      .lean();

    res.json({
      status: 'success',
      results: alerts.length,
      data: {
        alerts
      }
    });
  } catch (error) {
    console.error('Unread alerts error:', error);
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
});

/**
 * Get unresolved alerts
 */
exports.getUnresolvedAlerts = asyncHandler(async (req, res, next) => {
  try {
    const { type } = req.query;

    const query = { isResolved: false };
    if (type) query.type = type;

    const alerts = await Alert.find(query)
      .populate({
        path: 'item',
        select: 'name sku stockQuantity lowStockThreshold images unit'
      })
      .populate('user', 'firstName lastName email')
      .sort({ severity: -1, createdAt: -1 })
      .lean();

    res.json({
      status: 'success',
      results: alerts.length,
      data: {
        alerts
      }
    });
  } catch (error) {
    console.error('Unresolved alerts error:', error);
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
});

/**
 * Get critical alerts
 */
exports.getCriticalAlerts = asyncHandler(async (req, res, next) => {
  try {
    const alerts = await Alert.find({
      severity: 'critical',
      isResolved: false
    })
      .populate({
        path: 'item',
        select: 'name sku stockQuantity lowStockThreshold images unit'
      })
      .populate('user', 'firstName lastName email')
      .sort({ createdAt: -1 })
      .lean();

    res.json({
      status: 'success',
      results: alerts.length,
      data: {
        alerts
      }
    });
  } catch (error) {
    console.error('Critical alerts error:', error);
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
});

/**
 * Get alert by ID
 */
exports.getAlertById = asyncHandler(async (req, res, next) => {
  const alert = await Alert.findById(req.params.id)
    .populate({
      path: 'item',
      select: 'name sku stockQuantity lowStockThreshold images category unit'
    })
    .populate('user', 'firstName lastName email')
    .populate('resolvedBy', 'firstName lastName email')
    .lean();

  if (!alert) {
    return next(new AppError('Alert not found', 404));
  }

  res.json({
    status: 'success',
    data: {
      alert
    }
  });
});

/**
 * Mark alert as read
 */
exports.markAsRead = asyncHandler(async (req, res, next) => {
  const alert = await Alert.findById(req.params.id);

  if (!alert) {
    return next(new AppError('Alert not found', 404));
  }

  await alert.markAsRead(req.userId);

  res.json({
    status: 'success',
    message: 'Alert marked as read',
    data: {
      alert
    }
  });
});

/**
 * Mark multiple alerts as read
 */
exports.markMultipleAsRead = asyncHandler(async (req, res, next) => {
  const { alertIds } = req.body;

  if (!alertIds || !Array.isArray(alertIds) || alertIds.length === 0) {
    return next(new AppError('Alert IDs are required', 400));
  }

  const updatePromises = alertIds.map(async (alertId) => {
    const alert = await Alert.findById(alertId);
    if (alert) {
      await alert.markAsRead(req.userId);
    }
  });

  await Promise.all(updatePromises);

  res.json({
    status: 'success',
    message: `${alertIds.length} alerts marked as read`
  });
});

/**
 * Mark all alerts as read
 */
exports.markAllAsRead = asyncHandler(async (req, res, next) => {
  const alerts = await Alert.find({ isRead: false });

  const updatePromises = alerts.map(alert => alert.markAsRead(req.userId));
  await Promise.all(updatePromises);

  res.json({
    status: 'success',
    message: `${alerts.length} alerts marked as read`
  });
});

/**
 * Resolve alert
 */
exports.resolveAlert = asyncHandler(async (req, res, next) => {
  const { notes } = req.body;

  const alert = await Alert.findById(req.params.id);

  if (!alert) {
    return next(new AppError('Alert not found', 404));
  }

  if (alert.isResolved) {
    return next(new AppError('Alert is already resolved', 400));
  }

  await alert.markAsResolved(req.userId, notes);

  await AuditLog.logAction({
    action: 'alert.resolve',
    resource: 'alert',
    resourceId: alert._id,
    resourceModel: 'Alert',
    actor: req.userId,
    description: `Resolved alert: ${alert.title}`,
    metadata: {
      alertType: alert.type,
      notes,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    }
  });

  res.json({
    status: 'success',
    message: 'Alert resolved successfully',
    data: {
      alert
    }
  });
});

/**
 * Delete alert
 */
exports.deleteAlert = asyncHandler(async (req, res, next) => {
  const alert = await Alert.findByIdAndDelete(req.params.id);

  if (!alert) {
    return next(new AppError('Alert not found', 404));
  }

  await AuditLog.logAction({
    action: 'alert.delete',
    resource: 'alert',
    resourceId: alert._id,
    resourceModel: 'Alert',
    actor: req.userId,
    description: `Deleted alert: ${alert.title}`,
    severity: 'medium',
    metadata: {
      alertType: alert.type,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    }
  });

  res.json({
    status: 'success',
    message: 'Alert deleted successfully'
  });
});

/**
 * Get alert statistics
 */
exports.getAlertStats = asyncHandler(async (req, res, next) => {
  const stats = await Alert.getAlertStatistics();

  res.json({
    status: 'success',
    data: stats
  });
});

/**
 * Send alert notification
 */
exports.sendNotification = asyncHandler(async (req, res, next) => {
  const { channels = ['email'] } = req.body;

  const alert = await Alert.findById(req.params.id)
    .populate('item', 'name sku stockQuantity lowStockThreshold');

  if (!alert) {
    return next(new AppError('Alert not found', 404));
  }

  await alert.sendNotifications(channels);

  res.json({
    status: 'success',
    message: 'Notification sent successfully',
    data: {
      alert
    }
  });
});

/**
 * Cleanup old resolved alerts
 */
exports.cleanupOldAlerts = asyncHandler(async (req, res, next) => {
  const { daysOld = 90 } = req.query;

  const result = await Alert.cleanupOldAlerts(Number(daysOld));

  await AuditLog.logAction({
    action: 'alert.delete',
    resource: 'alert',
    actor: req.userId,
    description: `Cleaned up ${result.deletedCount} old alerts`,
    metadata: {
      deletedCount: result.deletedCount,
      daysOld,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    }
  });

  res.json({
    status: 'success',
    message: `${result.deletedCount} old alerts cleaned up successfully`
  });
});

/**
 * Create manual alert
 */
exports.createAlert = asyncHandler(async (req, res, next) => {
  const { type, severity, title, message, item, metadata } = req.body;

  if (!message) {
    return next(new AppError('Alert message is required', 400));
  }

  const alert = await Alert.create({
    type: type || 'system',
    severity: severity || 'info',
    title,
    message,
    item,
    metadata
  });

  await AuditLog.logAction({
    action: 'alert.create',
    resource: 'alert',
    resourceId: alert._id,
    resourceModel: 'Alert',
    actor: req.userId,
    description: `Created alert: ${alert.title}`,
    metadata: {
      alertType: alert.type,
      severity: alert.severity,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    }
  });

  res.status(201).json({
    status: 'success',
    message: 'Alert created successfully',
    data: {
      alert
    }
  });
});

/**
 * Get alerts by type
 */
exports.getAlertsByType = asyncHandler(async (req, res, next) => {
  const { type } = req.params;

  const alerts = await Alert.find({ type, isResolved: false })
    .populate({
      path: 'item',
      select: 'name sku stockQuantity lowStockThreshold images unit'
    })
    .sort({ severity: -1, createdAt: -1 })
    .lean();

  res.json({
    status: 'success',
    results: alerts.length,
    data: {
      alerts
    }
  });
});

/**
 * Get alerts by severity
 */
exports.getAlertsBySeverity = asyncHandler(async (req, res, next) => {
  const { severity } = req.params;

  const alerts = await Alert.find({ severity, isResolved: false })
    .populate({
      path: 'item',
      select: 'name sku stockQuantity lowStockThreshold images unit'
    })
    .sort({ createdAt: -1 })
    .lean();

  res.json({
    status: 'success',
    results: alerts.length,
    data: {
      alerts
    }
  });
});

module.exports = exports;