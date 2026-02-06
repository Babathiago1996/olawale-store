const { User, AuditLog } = require('../models');
const jwtService = require('../utils/jwt');
const { AppError, asyncHandler } = require('../utils/AppError');
const emailService = require('../services/email.service');

/**
 * Register new user
 */
exports.register = asyncHandler(async (req, res, next) => {
  const { firstName, lastName, email, password, role, phone } = req.body;

  // Check if email already exists
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return next(new AppError('Email already registered', 400));
  }

  // Create user
  const user = await User.create({
    firstName,
    lastName,
    email,
    password,
    role: role || 'staff',
    phone,
    createdBy: req.userId || null
  });

  // Generate tokens
  const tokens = jwtService.generateTokenPair({
    userId: user._id,
    email: user.email,
    role: user.role
  });

  // Save refresh token
  user.refreshTokens.push({
    token: tokens.refreshToken,
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    device: req.headers['user-agent'],
    ipAddress: req.ip
  });
  await user.save();

  // Log action
  await AuditLog.logAction({
    action: 'user.register',
    resource: 'user',
    resourceId: user._id,
    resourceModel: 'User',
    actor: user._id,
    description: `User ${user.email} registered successfully`,
    metadata: {
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    }
  });

  // Remove password from response
  user.password = undefined;

  res.status(201).json({
    status: 'success',
    message: 'User registered successfully',
    data: {
      user,
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken
    }
  });
});

/**
 * Login user
 */
exports.login = asyncHandler(async (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return next(new AppError('Please provide email and password', 400));
  }

  // Find user with password
  const user = await User.findOne({ email }).select('+password');

  if (!user) {
    return next(new AppError('Invalid email or password', 401));
  }

  // Check if account is locked
  if (user.isLocked) {
    await AuditLog.logAction({
      action: 'security.login.failed',
      resource: 'user',
      resourceId: user._id,
      resourceModel: 'User',
      actor: user._id,
      description: 'Login attempt on locked account',
      severity: 'high',
      status: 'failed',
      metadata: {
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
        reason: 'account_locked'
      }
    });
    return next(new AppError('Account is locked. Please contact support.', 403));
  }

  // Check if account is active
  if (!user.isActive) {
    return next(new AppError('Account is deactivated. Please contact support.', 403));
  }

  // Verify password
  const isPasswordCorrect = await user.comparePassword(password);

  if (!isPasswordCorrect) {
    // Increment login attempts
    await user.incrementLoginAttempts();

    await AuditLog.logAction({
      action: 'security.login.failed',
      resource: 'user',
      resourceId: user._id,
      resourceModel: 'User',
      actor: user._id,
      description: 'Failed login attempt - invalid password',
      severity: 'medium',
      status: 'failed',
      metadata: {
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
        reason: 'invalid_password'
      }
    });

    return next(new AppError('Invalid email or password', 401));
  }

  // Reset login attempts on successful login
  if (user.loginAttempts > 0) {
    await user.resetLoginAttempts();
  }

  // Update last login
  user.lastLogin = new Date();

  // Generate tokens
  const tokens = jwtService.generateTokenPair({
    userId: user._id,
    email: user.email,
    role: user.role
  });

  // Clean up expired refresh tokens
  user.refreshTokens = user.refreshTokens.filter(
    t => t.expiresAt > new Date()
  );

  // Add new refresh token
  user.refreshTokens.push({
    token: tokens.refreshToken,
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    device: req.headers['user-agent'],
    ipAddress: req.ip
  });

  await user.save();

  // Log successful login
  await AuditLog.logAction({
    action: 'user.login',
    resource: 'user',
    resourceId: user._id,
    resourceModel: 'User',
    actor: user._id,
    description: `User ${user.email} logged in successfully`,
    metadata: {
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    }
  });

  // Remove password from response
  user.password = undefined;

  res.json({
    status: 'success',
    message: 'Login successful',
    data: {
      user,
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken
    }
  });
});

/**
 * Refresh access token
 */
exports.refreshToken = asyncHandler(async (req, res, next) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return next(new AppError('Refresh token is required', 400));
  }

  // Verify refresh token
  const { valid, decoded } = jwtService.verifyRefreshToken(refreshToken);

  if (!valid) {
    return next(new AppError('Invalid or expired refresh token', 401));
  }

  // Get user
  const user = await User.findById(decoded.userId);

  if (!user || !user.isActive) {
    return next(new AppError('User not found or inactive', 401));
  }

  // Check if refresh token exists
  const tokenExists = user.refreshTokens.some(t => t.token === refreshToken);

  if (!tokenExists) {
    return next(new AppError('Invalid refresh token', 401));
  }

  // Generate new access token
  const accessToken = jwtService.generateAccessToken({
    userId: user._id,
    email: user.email,
    role: user.role
  });

  res.json({
    status: 'success',
    data: {
      accessToken
    }
  });
});

/**
 * Logout user
 */
exports.logout = asyncHandler(async (req, res, next) => {
  const { refreshToken } = req.body;

  if (refreshToken) {
    // Remove specific refresh token
    await User.findByIdAndUpdate(req.userId, {
      $pull: { refreshTokens: { token: refreshToken } }
    });
  }

  // Log logout
  await AuditLog.logAction({
    action: 'user.logout',
    resource: 'user',
    resourceId: req.userId,
    resourceModel: 'User',
    actor: req.userId,
    description: 'User logged out',
    metadata: {
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    }
  });

  res.json({
    status: 'success',
    message: 'Logout successful'
  });
});

/**
 * Logout from all devices
 */
exports.logoutAll = asyncHandler(async (req, res, next) => {
  // Remove all refresh tokens
  await User.findByIdAndUpdate(req.userId, {
    $set: { refreshTokens: [] }
  });

  // Log logout from all devices
  await AuditLog.logAction({
    action: 'user.logout',
    resource: 'user',
    resourceId: req.userId,
    resourceModel: 'User',
    actor: req.userId,
    description: 'User logged out from all devices',
    metadata: {
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    }
  });

  res.json({
    status: 'success',
    message: 'Logged out from all devices'
  });
});

/**
 * Request password reset with OTP
 */
exports.requestPasswordReset = asyncHandler(async (req, res, next) => {
  const { email } = req.body;

  if (!email) {
    return next(new AppError('Email is required', 400));
  }

  const user = await User.findOne({ email });

  if (!user) {
    // Don't reveal if user exists
    return res.json({
      status: 'success',
      message: 'If the email exists, a password reset OTP has been sent'
    });
  }

  // Generate OTP
  const otp = user.generatePasswordResetOTP();
  await user.save();

  // Send OTP via email
  try {
    await emailService.sendPasswordResetOTP(user.email, otp, user.firstName);

    // Log action
    await AuditLog.logAction({
      action: 'user.password.reset',
      resource: 'user',
      resourceId: user._id,
      resourceModel: 'User',
      actor: user._id,
      description: 'Password reset OTP requested',
      metadata: {
        ipAddress: req.ip,
        userAgent: req.headers['user-agent']
      }
    });
  } catch (error) {
    user.passwordResetOTP = undefined;
    user.passwordResetOTPExpires = undefined;
    await user.save();
    
    return next(new AppError('Failed to send password reset email', 500));
  }

  res.json({
    status: 'success',
    message: 'If the email exists, a password reset OTP has been sent'
  });
});

/**
 * Verify password reset OTP
 */
exports.verifyPasswordResetOTP = asyncHandler(async (req, res, next) => {
  const { email, otp } = req.body;

  if (!email || !otp) {
    return next(new AppError('Email and OTP are required', 400));
  }

  const user = await User.findOne({ email });

  if (!user) {
    return next(new AppError('Invalid OTP', 400));
  }

  // Verify OTP
  const isOTPValid = user.verifyPasswordResetOTP(otp);

  if (!isOTPValid) {
    return next(new AppError('Invalid or expired OTP', 400));
  }

  // Generate temporary token for password reset
  const resetToken = jwtService.generateAccessToken({
    userId: user._id,
    email: user.email,
    role: user.role
  });

  res.json({
    status: 'success',
    message: 'OTP verified successfully',
    data: {
      resetToken
    }
  });
});

/**
 * Reset password with OTP
 */
exports.resetPassword = asyncHandler(async (req, res, next) => {
  const { email, otp, newPassword } = req.body;

  if (!email || !otp || !newPassword) {
    return next(new AppError('Email, OTP, and new password are required', 400));
  }

  const user = await User.findOne({ email });

  if (!user) {
    return next(new AppError('Invalid OTP', 400));
  }

  // Verify OTP
  const isOTPValid = user.verifyPasswordResetOTP(otp);

  if (!isOTPValid) {
    return next(new AppError('Invalid or expired OTP', 400));
  }

  // Update password
  user.password = newPassword;
  await user.clearPasswordReset();
  await user.save();

  // Log action
  await AuditLog.logAction({
    action: 'user.password.change',
    resource: 'user',
    resourceId: user._id,
    resourceModel: 'User',
    actor: user._id,
    description: 'Password reset completed via OTP',
    metadata: {
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    }
  });

  res.json({
    status: 'success',
    message: 'Password reset successful'
  });
});

/**
 * Change password (authenticated user)
 */
exports.changePassword = asyncHandler(async (req, res, next) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    return next(new AppError('Current and new passwords are required', 400));
  }

  // Get user with password
  const user = await User.findById(req.userId).select('+password');

  // Verify current password
  const isPasswordCorrect = await user.comparePassword(currentPassword);

  if (!isPasswordCorrect) {
    return next(new AppError('Current password is incorrect', 401));
  }

  // Update password
  user.password = newPassword;
  await user.save();

  // Log action
  await AuditLog.logAction({
    action: 'user.password.change',
    resource: 'user',
    resourceId: user._id,
    resourceModel: 'User',
    actor: user._id,
    description: 'Password changed successfully',
    metadata: {
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    }
  });

  res.json({
    status: 'success',
    message: 'Password changed successfully'
  });
});

/**
 * Get current user
 */
exports.getCurrentUser = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.userId);

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

module.exports = exports;