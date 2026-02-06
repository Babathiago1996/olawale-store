const mongoose = require('mongoose');

const alertSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['low_stock', 'out_of_stock', 'expiry_warning', 'system', 'user_action', 'security'],
    required: true
  },
  severity: {
    type: String,
    enum: ['info', 'warning', 'critical'],
    default: 'info'
  },
  title: {
    type: String,
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters']
  },
  message: {
    type: String,
    required: [true, 'Alert message is required'],
    trim: true,
    maxlength: [1000, 'Message cannot exceed 1000 characters']
  },
  item: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Item'
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  isRead: {
    type: Boolean,
    default: false
  },
  isResolved: {
    type: Boolean,
    default: false
  },
  readBy: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    readAt: {
      type: Date,
      default: Date.now
    }
  }],
  resolvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  resolvedAt: Date,
  resolutionNotes: {
    type: String,
    maxlength: [500, 'Resolution notes cannot exceed 500 characters']
  },
  notificationSent: {
    email: {
      type: Boolean,
      default: false
    },
    push: {
      type: Boolean,
      default: false
    },
    sms: {
      type: Boolean,
      default: false
    }
  },
  expiresAt: {
    type: Date
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for performance
alertSchema.index({ type: 1, isResolved: 1 });
alertSchema.index({ severity: 1, isRead: 1 });
alertSchema.index({ item: 1 });
alertSchema.index({ user: 1 });
alertSchema.index({ createdAt: -1 });
alertSchema.index({ isRead: 1, isResolved: 1 });
alertSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Virtual for age of alert
alertSchema.virtual('age').get(function() {
  return Date.now() - this.createdAt.getTime();
});

// Virtual for urgency score
alertSchema.virtual('urgencyScore').get(function() {
  let score = 0;
  
  // Severity points
  if (this.severity === 'critical') score += 100;
  else if (this.severity === 'warning') score += 50;
  else score += 10;
  
  // Age penalty (older alerts are more urgent)
  const ageInHours = this.age / (1000 * 60 * 60);
  score += Math.min(ageInHours * 5, 50);
  
  // Unread bonus
  if (!this.isRead) score += 25;
  
  // Unresolved bonus
  if (!this.isResolved) score += 25;
  
  return Math.round(score);
});

// Pre-save middleware to set title if not provided
alertSchema.pre('save', function(next) {
  if (!this.title) {
    switch (this.type) {
      case 'low_stock':
        this.title = 'Low Stock Alert';
        break;
      case 'out_of_stock':
        this.title = 'Out of Stock Alert';
        break;
      case 'expiry_warning':
        this.title = 'Expiry Warning';
        break;
      case 'system':
        this.title = 'System Notification';
        break;
      case 'user_action':
        this.title = 'User Action Required';
        break;
      case 'security':
        this.title = 'Security Alert';
        break;
      default:
        this.title = 'Notification';
    }
  }
  
  // Set expiry for auto-resolving alerts (7 days for info, 30 days for others)
  if (!this.expiresAt && this.type !== 'security') {
    const daysToExpire = this.severity === 'info' ? 7 : 30;
    this.expiresAt = new Date(Date.now() + daysToExpire * 24 * 60 * 60 * 1000);
  }
  
  next();
});

// Method to mark as read
alertSchema.methods.markAsRead = async function(userId) {
  if (!this.isRead) {
    this.isRead = true;
  }
  
  // Add to readBy array if not already present
  const alreadyRead = this.readBy.some(r => r.user.toString() === userId.toString());
  if (!alreadyRead) {
    this.readBy.push({
      user: userId,
      readAt: new Date()
    });
  }
  
  return await this.save();
};

// Method to mark as resolved
alertSchema.methods.markAsResolved = async function(userId, notes) {
  this.isResolved = true;
  this.resolvedBy = userId;
  this.resolvedAt = new Date();
  if (notes) {
    this.resolutionNotes = notes;
  }
  return await this.save();
};

// Method to send notifications
alertSchema.methods.sendNotifications = async function(channels = ['email']) {
  // Placeholder for actual notification logic
  // This would integrate with email service, push notification service, etc.
  
  const notificationPromises = [];
  
  if (channels.includes('email')) {
    // Send email notification
    this.notificationSent.email = true;
    // notificationPromises.push(sendEmailNotification(this));
  }
  
  if (channels.includes('push')) {
    // Send push notification
    this.notificationSent.push = true;
    // notificationPromises.push(sendPushNotification(this));
  }
  
  if (channels.includes('sms')) {
    // Send SMS notification
    this.notificationSent.sms = true;
    // notificationPromises.push(sendSMSNotification(this));
  }
  
  await Promise.all(notificationPromises);
  return await this.save();
};

// Static method to get unread alerts
alertSchema.statics.getUnreadAlerts = function(userId = null) {
  const query = { isRead: false, isResolved: false };
  if (userId) {
    query.$or = [
      { user: userId },
      { user: { $exists: false } }
    ];
  }
  return this.find(query)
    .populate('item', 'name sku stockQuantity')
    .populate('user', 'firstName lastName email')
    .sort({ severity: -1, createdAt: -1 });
};

// Static method to get unresolved alerts
alertSchema.statics.getUnresolvedAlerts = function(type = null) {
  const query = { isResolved: false };
  if (type) {
    query.type = type;
  }
  return this.find(query)
    .populate('item', 'name sku stockQuantity')
    .populate('user', 'firstName lastName email')
    .sort({ severity: -1, createdAt: -1 });
};

// Static method to get alerts by severity
alertSchema.statics.getAlertsBySeverity = function(severity) {
  return this.find({ severity, isResolved: false })
    .populate('item', 'name sku stockQuantity')
    .sort({ createdAt: -1 });
};

// Static method to get critical alerts
alertSchema.statics.getCriticalAlerts = function() {
  return this.find({
    severity: 'critical',
    isResolved: false
  })
    .populate('item', 'name sku stockQuantity lowStockThreshold')
    .populate('user', 'firstName lastName email')
    .sort({ createdAt: -1 });
};

// Static method to get alert statistics
alertSchema.statics.getAlertStatistics = async function() {
  const [total, unread, unresolved, bySeverity, byType] = await Promise.all([
    this.countDocuments(),
    this.countDocuments({ isRead: false }),
    this.countDocuments({ isResolved: false }),
    this.aggregate([
      { $match: { isResolved: false } },
      { $group: { _id: '$severity', count: { $sum: 1 } } }
    ]),
    this.aggregate([
      { $match: { isResolved: false } },
      { $group: { _id: '$type', count: { $sum: 1 } } }
    ])
  ]);
  
  return {
    total,
    unread,
    unresolved,
    bySeverity: bySeverity.reduce((acc, item) => {
      acc[item._id] = item.count;
      return acc;
    }, {}),
    byType: byType.reduce((acc, item) => {
      acc[item._id] = item.count;
      return acc;
    }, {})
  };
};

// Static method to cleanup old resolved alerts
alertSchema.statics.cleanupOldAlerts = async function(daysOld = 90) {
  const cutoffDate = new Date(Date.now() - daysOld * 24 * 60 * 60 * 1000);
  return this.deleteMany({
    isResolved: true,
    resolvedAt: { $lt: cutoffDate }
  });
};

// Static method to create low stock alert
alertSchema.statics.createLowStockAlert = async function(item) {
  return this.create({
    type: 'low_stock',
    severity: 'warning',
    message: `${item.name} stock is running low (${item.stockQuantity} ${item.unit} remaining)`,
    item: item._id,
    metadata: {
      currentStock: item.stockQuantity,
      threshold: item.lowStockThreshold,
      sku: item.sku
    }
  });
};

// Static method to create out of stock alert
alertSchema.statics.createOutOfStockAlert = async function(item) {
  return this.create({
    type: 'out_of_stock',
    severity: 'critical',
    message: `${item.name} is out of stock`,
    item: item._id,
    metadata: {
      sku: item.sku,
      lastStockQuantity: 0
    }
  });
};

module.exports =
  mongoose.models.Alert || mongoose.model("Alert", alertSchema);
