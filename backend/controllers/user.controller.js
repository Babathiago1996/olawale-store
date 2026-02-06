const { User, AuditLog } = require('../models');
const { AppError, asyncHandler } = require('../utils/AppError');
const cloudinaryService = require('../services/cloudinary.service');

/**
 * Get all users
 */
exports.getAllUsers = asyncHandler(async (req, res, next) => {
  const {
    page = 1,
    limit = 20,
    role,
    isActive,
    search,
    sortBy = 'createdAt',
    order = 'desc'
  } = req.query;

  // Build query
  const query = {};

  if (role) {
    query.role = role;
  }

  if (isActive !== undefined) {
    query.isActive = isActive === 'true';
  }

  if (search) {
    query.$or = [
      { firstName: { $regex: search, $options: 'i' } },
      { lastName: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } }
    ];
  }

  // Build sort
  const sort = {};
  sort[sortBy] = order === 'asc' ? 1 : -1;

  // Execute query with pagination
  const skip = (Number(page) - 1) * Number(limit);
  
  const [users, total] = await Promise.all([
    User.find(query)
      .select('-password')
      .populate('createdBy', 'firstName lastName')
      .sort(sort)
      .skip(skip)
      .limit(Number(limit)),
    User.countDocuments(query)
  ]);

  res.json({
    status: 'success',
    results: users.length,
    pagination: {
      page: Number(page),
      limit: Number(limit),
      total,
      pages: Math.ceil(total / Number(limit))
    },
    data: {
      users
    }
  });
});

/**
 * Get user by ID
 */
exports.getUserById = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.params.id)
    .select('-password')
    .populate('createdBy', 'firstName lastName email');

  if (!user) {
    return next(new AppError('User not found', 404));
  }

  res.json({
    status: 'success',
    data: {
      user
    }
  });
});

/**
 * Update user profile
 */
exports.updateProfile = asyncHandler(async (req, res, next) => {
  const { firstName, lastName, phone } = req.body;

  const user = await User.findById(req.userId);

  if (!user) {
    return next(new AppError('User not found', 404));
  }

  // Store old values for audit
  const oldValues = user.toObject();

  // Handle profile image upload
  if (req.file) {
    // Delete old image if exists
    if (user.profileImage && user.profileImage.publicId) {
      await cloudinaryService.deleteImage(user.profileImage.publicId);
    }

    const uploadedImage = await cloudinaryService.uploadImage(
      req.file,
      'profiles'
    );
    user.profileImage = {
      url: uploadedImage.url,
      publicId: uploadedImage.publicId
    };
  }

  if (firstName) user.firstName = firstName;
  if (lastName) user.lastName = lastName;
  if (phone !== undefined) user.phone = phone;

  user.updatedBy = req.userId;
  await user.save();

  // Log action
  await AuditLog.logAction({
    action: 'user.update',
    resource: 'user',
    resourceId: user._id,
    resourceModel: 'User',
    actor: req.userId,
    description: 'Updated user profile',
    changes: {
      before: oldValues,
      after: user.toObject()
    },
    metadata: {
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    }
  });

  // Remove password from response
  user.password = undefined;

  res.json({
    status: 'success',
    message: 'Profile updated successfully',
    data: {
      user
    }
  });
});

/**
 * Update user (Admin only)
 */
exports.updateUser = asyncHandler(async (req, res, next) => {
  const { firstName, lastName, email, phone, role, isActive } = req.body;

  const user = await User.findById(req.params.id);

  if (!user) {
    return next(new AppError('User not found', 404));
  }

  // Store old values for audit
  const oldValues = user.toObject();

  // Check if email is being changed and if it already exists
  if (email && email !== user.email) {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return next(new AppError('Email already exists', 400));
    }
    user.email = email;
  }

  if (firstName) user.firstName = firstName;
  if (lastName) user.lastName = lastName;
  if (phone !== undefined) user.phone = phone;
  if (role) user.role = role;
  if (isActive !== undefined) user.isActive = isActive;

  user.updatedBy = req.userId;
  await user.save();

  // Log action
  await AuditLog.logAction({
    action: 'user.update',
    resource: 'user',
    resourceId: user._id,
    resourceModel: 'User',
    actor: req.userId,
    description: `Updated user: ${user.email}`,
    changes: {
      before: oldValues,
      after: user.toObject()
    },
    severity: 'medium',
    metadata: {
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    }
  });

  // Remove password from response
  user.password = undefined;

  res.json({
    status: 'success',
    message: 'User updated successfully',
    data: {
      user
    }
  });
});

/**
 * Delete user (Admin only)
 */
exports.deleteUser = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.params.id);

  if (!user) {
    return next(new AppError('User not found', 404));
  }

  // Prevent admin from deleting themselves
  if (user._id.toString() === req.userId.toString()) {
    return next(new AppError('You cannot delete your own account', 400));
  }

  // Soft delete
  user.isActive = false;
  user.updatedBy = req.userId;
  await user.save();

  // Log action
  await AuditLog.logAction({
    action: 'user.delete',
    resource: 'user',
    resourceId: user._id,
    resourceModel: 'User',
    actor: req.userId,
    description: `Deleted user: ${user.email}`,
    severity: 'high',
    metadata: {
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    }
  });

  res.json({
    status: 'success',
    message: 'User deleted successfully'
  });
});

/**
 * Change user role (Admin only)
 */
exports.changeUserRole = asyncHandler(async (req, res, next) => {
  const { role } = req.body;

  if (!role) {
    return next(new AppError('Role is required', 400));
  }

  const user = await User.findById(req.params.id);

  if (!user) {
    return next(new AppError('User not found', 404));
  }

  const oldRole = user.role;
  user.role = role;
  user.updatedBy = req.userId;
  await user.save();

  // Log action
  await AuditLog.logAction({
    action: 'user.role.change',
    resource: 'user',
    resourceId: user._id,
    resourceModel: 'User',
    actor: req.userId,
    description: `Changed user role from ${oldRole} to ${role}`,
    severity: 'high',
    changes: {
      before: { role: oldRole },
      after: { role }
    },
    metadata: {
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    }
  });

  res.json({
    status: 'success',
    message: 'User role updated successfully',
    data: {
      user
    }
  });
});

/**
 * Get users by role
 */
exports.getUsersByRole = asyncHandler(async (req, res, next) => {
  const { role } = req.params;

  const users = await User.getUsersByRole(role);

  res.json({
    status: 'success',
    results: users.length,
    data: {
      users
    }
  });
});

/**
 * Get user statistics
 */
exports.getUserStats = asyncHandler(async (req, res, next) => {
  const [totalUsers, activeUsers, byRole] = await Promise.all([
    User.countDocuments(),
    User.countDocuments({ isActive: true }),
    User.aggregate([
      {
        $group: {
          _id: '$role',
          count: { $sum: 1 }
        }
      }
    ])
  ]);

  const roleStats = byRole.reduce((acc, item) => {
    acc[item._id] = item.count;
    return acc;
  }, {});

  res.json({
    status: 'success',
    data: {
      totalUsers,
      activeUsers,
      inactiveUsers: totalUsers - activeUsers,
      byRole: roleStats
    }
  });
});

/**
 * Deactivate user account
 */
exports.deactivateAccount = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.userId);

  if (!user) {
    return next(new AppError('User not found', 404));
  }

  user.isActive = false;
  await user.save();

  // Log action
  await AuditLog.logAction({
    action: 'user.delete',
    resource: 'user',
    resourceId: user._id,
    resourceModel: 'User',
    actor: req.userId,
    description: 'User deactivated their account',
    metadata: {
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    }
  });

  res.json({
    status: 'success',
    message: 'Account deactivated successfully'
  });
});

/**
 * Reactivate user account (Admin only)
 */
exports.reactivateAccount = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.params.id);

  if (!user) {
    return next(new AppError('User not found', 404));
  }

  user.isActive = true;
  user.updatedBy = req.userId;
  await user.save();

  // Log action
  await AuditLog.logAction({
    action: 'user.update',
    resource: 'user',
    resourceId: user._id,
    resourceModel: 'User',
    actor: req.userId,
    description: `Reactivated user account: ${user.email}`,
    metadata: {
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    }
  });

  res.json({
    status: 'success',
    message: 'Account reactivated successfully',
    data: {
      user
    }
  });
});

/**
 * Get user activity logs
 */
exports.getUserActivity = asyncHandler(async (req, res, next) => {
  const { limit = 50 } = req.query;

  const activities = await AuditLog.getLogsByActor(
    req.params.id || req.userId,
    Number(limit)
  );

  res.json({
    status: 'success',
    results: activities.length,
    data: {
      activities
    }
  });
});

module.exports = exports;