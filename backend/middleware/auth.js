const jwtService = require('../utils/jwt');
const { User } = require('../models');
const { AppError, asyncHandler } = require('../utils/AppError');


/**
 * Authenticate user with JWT
 */
exports.authenticate = asyncHandler(async (req, res, next) => {
  // Extract token from header
  const authHeader = req.headers.authorization;
  const token = jwtService.extractTokenFromHeader(authHeader);

  if (!token) {
    return next(new AppError('Access token is required', 401));
  }

  // Verify token
  const { valid, expired, decoded, error } = jwtService.verifyAccessToken(token);

  if (!valid) {
    if (expired) {
      return next(new AppError('Access token has expired', 401));
    }
    return next(new AppError(`Invalid access token: ${error}`, 401));
  }

  // Get user from database
  const user = await User.findById(decoded.userId).select('-password');

  if (!user) {
    return next(new AppError('User not found or has been deleted', 401));
  }

  if (!user.isActive) {
    return next(new AppError('User account is deactivated', 403));
  }

  if (user.isLocked) {
    return next(new AppError('Account is locked due to too many failed login attempts', 403));
  }

  // Attach user to request
  req.user = user;
  req.userId = user._id;
  req.userRole = user.role;

  next();
});

/**
 * Authorize user based on roles
 */
exports.authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new AppError('Authentication required', 401));
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(
        new AppError(
          `Access denied. Required role(s): ${allowedRoles.join(', ')}`,
          403
        )
      );
    }

    next();
  };
};

/**
 * Optional authentication - doesn't fail if no token
 */
exports.optionalAuth = asyncHandler(async (req, res, next) => {
  const authHeader = req.headers.authorization;
  const token = jwtService.extractTokenFromHeader(authHeader);

  if (token) {
    const { valid, decoded } = jwtService.verifyAccessToken(token);

    if (valid) {
      const user = await User.findById(decoded.userId).select('-password');
      if (user && user.isActive) {
        req.user = user;
        req.userId = user._id;
        req.userRole = user.role;
      }
    }
  }

  next();
});

/**
 * Verify refresh token
 */
exports.verifyRefreshToken = asyncHandler(async (req, res, next) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return next(new AppError('Refresh token is required', 400));
  }

  const { valid, expired, decoded, error } = jwtService.verifyRefreshToken(refreshToken);

  if (!valid) {
    if (expired) {
      return next(new AppError('Refresh token has expired', 401));
    }
    return next(new AppError(`Invalid refresh token: ${error}`, 401));
  }

  // Get user from database
  const user = await User.findById(decoded.userId).select('-password');

  if (!user) {
    return next(new AppError('User not found', 401));
  }

  if (!user.isActive) {
    return next(new AppError('User account is deactivated', 403));
  }

  // Check if refresh token exists in user's tokens
  const tokenExists = user.refreshTokens.some(
    t => t.token === refreshToken
  );

  if (!tokenExists) {
    return next(new AppError('Invalid refresh token', 401));
  }

  req.user = user;
  req.refreshToken = refreshToken;
  req.tokenJti = decoded.jti;

  next();
});

/**
 * Check if user owns the resource
 */
exports.checkOwnership = (resourceParam = 'id') => {
  return asyncHandler(async (req, res, next) => {
    const resourceId = req.params[resourceParam];
    const userId = req.userId;

    // Admin can access everything
    if (req.userRole === 'admin') {
      return next();
    }

    // Check if user owns the resource
    if (resourceId !== userId.toString()) {
      return next(new AppError('You can only access your own resources', 403));
    }

    next();
  });
};

/**
 * Rate limiting check for sensitive operations
 */
exports.checkRateLimit = (maxAttempts = 5, windowMs = 15 * 60 * 1000) => {
  const attempts = new Map();

  return (req, res, next) => {
    const key = req.ip || req.connection.remoteAddress;
    const now = Date.now();

    if (!attempts.has(key)) {
      attempts.set(key, []);
    }

    const userAttempts = attempts.get(key);
    const recentAttempts = userAttempts.filter(time => now - time < windowMs);

    if (recentAttempts.length >= maxAttempts) {
      return next(
        new AppError(
          `Too many attempts. Please try again later.`,
          429
        )
      );
    }

    recentAttempts.push(now);
    attempts.set(key, recentAttempts);

    // Cleanup old entries periodically
    if (Math.random() < 0.01) {
      for (const [k, times] of attempts.entries()) {
        const validTimes = times.filter(time => now - time < windowMs);
        if (validTimes.length === 0) {
          attempts.delete(k);
        } else {
          attempts.set(k, validTimes);
        }
      }
    }

    next();
  };
};

/**
 * Verify user email before allowing certain actions
 */
exports.requireEmailVerification = (req, res, next) => {
  if (!req.user.isEmailVerified) {
    return next(
      new AppError('Please verify your email address to perform this action', 403)
    );
  }
  next();
};

/**
 * Check permission for specific action on resource
 */
exports.checkPermission = (resource, action) => {
  const permissions = {
    admin: {
      user: ['create', 'read', 'update', 'delete'],
      item: ['create', 'read', 'update', 'delete', 'restock'],
      category: ['create', 'read', 'update', 'delete'],
      sale: ['create', 'read', 'update', 'delete', 'cancel'],
      alert: ['create', 'read', 'update', 'delete', 'resolve'],
      audit: ['read']
    },
    staff: {
      user: ['read'],
      item: ['create', 'read', 'update', 'restock'],
      category: ['create', 'read'],
      sale: ['create', 'read'],
      alert: ['read', 'resolve'],
      audit: []
    },
    auditor: {
      user: ['read'],
      item: ['read'],
      category: ['read'],
      sale: ['read'],
      alert: ['read'],
      audit: ['read']
    }
  };

  return (req, res, next) => {
    const userRole = req.userRole;
    
    if (!permissions[userRole]) {
      return next(new AppError('Invalid user role', 403));
    }

    const rolePermissions = permissions[userRole][resource] || [];
    
    if (!rolePermissions.includes(action)) {
      return next(
        new AppError(
          `You do not have permission to ${action} ${resource}`,
          403
        )
      );
    }

    next();
  };
};

/**
 * Extract and validate API key (for future API access)
 */
exports.validateApiKey = asyncHandler(async (req, res, next) => {
  const apiKey = req.headers['x-api-key'];

  if (!apiKey) {
    return next(new AppError('API key is required', 401));
  }

  // Validate API key (implement your logic here)
  // For now, just check against environment variable
  if (apiKey !== process.env.API_KEY) {
    return next(new AppError('Invalid API key', 401));
  }

  next();
});

module.exports = exports;