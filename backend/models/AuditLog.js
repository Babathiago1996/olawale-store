const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
  action: {
    type: String,
    required: [true, 'Action is required'],
    enum: [
      // User actions
      'user.login', 'user.logout', 'user.register', 'user.update', 'user.delete',
      'user.password.change', 'user.password.reset', 'user.role.change',
      // Item actions
      'item.create', 'item.update', 'item.delete', 'item.restock', 'item.view',
      // Category actions
      'category.create', 'category.update', 'category.delete',
      // Sale actions
      'sale.create', 'sale.cancel', 'sale.refund', 'sale.view',
      // Alert actions
      'alert.create', 'alert.resolve', 'alert.delete',
      // System actions
      'system.backup', 'system.restore', 'system.config.change',
      // Security actions
      'security.login.failed', 'security.unauthorized.access', 'security.permission.denied'
    ]
  },
  resource: {
    type: String,
    required: true,
    enum: ['user', 'item', 'category', 'sale', 'alert', 'system']
  },
  resourceId: {
    type: mongoose.Schema.Types.ObjectId,
    refPath: 'resourceModel'
  },
  resourceModel: {
    type: String,
    enum: ['User', 'Item', 'Category', 'Sale', 'Alert']
  },
  actor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  actorName: {
    type: String,
    required: true
  },
  actorRole: {
    type: String,
    enum: ['admin', 'staff', 'auditor', 'system']
  },
  description: {
    type: String,
    required: true,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  changes: {
    before: mongoose.Schema.Types.Mixed,
    after: mongoose.Schema.Types.Mixed
  },
  metadata: {
    ipAddress: String,
    userAgent: String,
    device: String,
    location: {
      country: String,
      city: String,
      coordinates: {
        latitude: Number,
        longitude: Number
      }
    },
    sessionId: String,
    requestId: String,
    duration: Number,
    error: String
  },
  severity: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'low'
  },
  status: {
    type: String,
    enum: ['success', 'failed', 'pending'],
    default: 'success'
  },
  tags: [{
    type: String,
    trim: true
  }]
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for performance
auditLogSchema.index({ action: 1, createdAt: -1 });
auditLogSchema.index({ resource: 1, resourceId: 1 });
auditLogSchema.index({ actor: 1, createdAt: -1 });
auditLogSchema.index({ createdAt: -1 });
auditLogSchema.index({ severity: 1, status: 1 });
auditLogSchema.index({ 'metadata.ipAddress': 1 });

// Virtual for resource type
auditLogSchema.virtual('actionCategory').get(function() {
  return this.action.split('.')[0];
});

// Static method to log action
auditLogSchema.statics.logAction = async function(data) {
  const {
    action,
    resource,
    resourceId,
    resourceModel,
    actor,
    description,
    changes,
    metadata = {},
    severity = 'low',
    status = 'success',
    tags = []
  } = data;
  
  // Get actor details
  const User = mongoose.model('User');
  const actorUser = await User.findById(actor).select('firstName lastName role');
  
  return this.create({
    action,
    resource,
    resourceId,
    resourceModel,
    actor,
    actorName: actorUser ? `${actorUser.firstName} ${actorUser.lastName}` : 'Unknown',
    actorRole: actorUser ? actorUser.role : 'system',
    description,
    changes,
    metadata,
    severity,
    status,
    tags
  });
};

// Static method to get logs by resource
auditLogSchema.statics.getLogsByResource = function(resource, resourceId, limit = 50) {
  return this.find({ resource, resourceId })
    .populate('actor', 'firstName lastName email role')
    .sort({ createdAt: -1 })
    .limit(limit);
};

// Static method to get logs by actor
auditLogSchema.statics.getLogsByActor = function(actorId, limit = 100) {
  return this.find({ actor: actorId })
    .sort({ createdAt: -1 })
    .limit(limit);
};

// Static method to get logs by date range
auditLogSchema.statics.getLogsByDateRange = function(startDate, endDate, filters = {}) {
  const query = {
    createdAt: { $gte: startDate, $lte: endDate },
    ...filters
  };
  
  return this.find(query)
    .populate('actor', 'firstName lastName email role')
    .sort({ createdAt: -1 });
};

// Static method to get security logs
auditLogSchema.statics.getSecurityLogs = function(limit = 100) {
  return this.find({
    $or: [
      { action: { $regex: /^security\./ } },
      { severity: { $in: ['high', 'critical'] } },
      { status: 'failed' }
    ]
  })
    .populate('actor', 'firstName lastName email role')
    .sort({ createdAt: -1 })
    .limit(limit);
};

// Static method to get failed actions
auditLogSchema.statics.getFailedActions = function(limit = 50) {
  return this.find({ status: 'failed' })
    .populate('actor', 'firstName lastName email role')
    .sort({ createdAt: -1 })
    .limit(limit);
};

// Static method to get audit statistics
auditLogSchema.statics.getAuditStatistics = async function(startDate, endDate) {
  const [totalLogs, byAction, byResource, bySeverity, byStatus] = await Promise.all([
    this.countDocuments({
      createdAt: { $gte: startDate, $lte: endDate }
    }),
    this.aggregate([
      { $match: { createdAt: { $gte: startDate, $lte: endDate } } },
      { $group: { _id: '$action', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]),
    this.aggregate([
      { $match: { createdAt: { $gte: startDate, $lte: endDate } } },
      { $group: { _id: '$resource', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]),
    this.aggregate([
      { $match: { createdAt: { $gte: startDate, $lte: endDate } } },
      { $group: { _id: '$severity', count: { $sum: 1 } } }
    ]),
    this.aggregate([
      { $match: { createdAt: { $gte: startDate, $lte: endDate } } },
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ])
  ]);
  
  return {
    totalLogs,
    topActions: byAction,
    byResource: byResource.reduce((acc, item) => {
      acc[item._id] = item.count;
      return acc;
    }, {}),
    bySeverity: bySeverity.reduce((acc, item) => {
      acc[item._id] = item.count;
      return acc;
    }, {}),
    byStatus: byStatus.reduce((acc, item) => {
      acc[item._id] = item.count;
      return acc;
    }, {})
  };
};

// Static method to get most active users
auditLogSchema.statics.getMostActiveUsers = async function(startDate, endDate, limit = 10) {
  return this.aggregate([
    { $match: { createdAt: { $gte: startDate, $lte: endDate } } },
    {
      $group: {
        _id: '$actor',
        actorName: { $first: '$actorName' },
        actorRole: { $first: '$actorRole' },
        actionCount: { $sum: 1 }
      }
    },
    { $sort: { actionCount: -1 } },
    { $limit: limit }
  ]);
};

// Static method to cleanup old logs
auditLogSchema.statics.cleanupOldLogs = async function(daysToKeep = 365) {
  const cutoffDate = new Date(Date.now() - daysToKeep * 24 * 60 * 60 * 1000);
  return this.deleteMany({
    createdAt: { $lt: cutoffDate },
    severity: { $in: ['low', 'medium'] }
  });
};

// Prevent modification or deletion of audit logs
auditLogSchema.pre('findOneAndUpdate', function(next) {
  next(new Error('Audit logs cannot be modified'));
});

auditLogSchema.pre('findOneAndDelete', function(next) {
  next(new Error('Audit logs cannot be deleted directly'));
});

auditLogSchema.pre('remove', function(next) {
  next(new Error('Audit logs cannot be deleted directly'));
});

const AuditLog = mongoose.model('AuditLog', auditLogSchema);

module.exports = AuditLog;