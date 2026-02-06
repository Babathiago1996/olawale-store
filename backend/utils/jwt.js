const jwt = require('jsonwebtoken');
const crypto = require('crypto');

class JWTService {
  constructor() {
    this.accessTokenSecret = process.env.JWT_ACCESS_SECRET;
    this.refreshTokenSecret = process.env.JWT_REFRESH_SECRET;
    this.accessTokenExpiry = process.env.JWT_ACCESS_EXPIRY || '15m';
    this.refreshTokenExpiry = process.env.JWT_REFRESH_EXPIRY || '7d';
  }

  /**
   * Generate access token
   */
  generateAccessToken(payload) {
    return jwt.sign(
      {
        userId: payload.userId,
        email: payload.email,
        role: payload.role,
        type: 'access'
      },
      this.accessTokenSecret,
      {
        expiresIn: this.accessTokenExpiry,
        issuer: 'olawale-store',
        audience: 'olawale-store-client'
      }
    );
  }

  /**
   * Generate refresh token
   */
  generateRefreshToken(payload) {
    const jti = crypto.randomBytes(16).toString('hex');
    
    return {
      token: jwt.sign(
        {
          userId: payload.userId,
          email: payload.email,
          role: payload.role,
          type: 'refresh',
          jti
        },
        this.refreshTokenSecret,
        {
          expiresIn: this.refreshTokenExpiry,
          issuer: 'olawale-store',
          audience: 'olawale-store-client'
        }
      ),
      jti
    };
  }

  /**
   * Generate both access and refresh tokens
   */
  generateTokenPair(payload) {
    const accessToken = this.generateAccessToken(payload);
    const refreshToken = this.generateRefreshToken(payload);
    
    return {
      accessToken,
      refreshToken: refreshToken.token,
      refreshTokenId: refreshToken.jti
    };
  }

  /**
   * Verify access token
   */
  verifyAccessToken(token) {
    try {
      const decoded = jwt.verify(token, this.accessTokenSecret, {
        issuer: 'olawale-store',
        audience: 'olawale-store-client'
      });
      
      if (decoded.type !== 'access') {
        throw new Error('Invalid token type');
      }
      
      return {
        valid: true,
        expired: false,
        decoded
      };
    } catch (error) {
      return {
        valid: false,
        expired: error.message === 'jwt expired',
        decoded: null,
        error: error.message
      };
    }
  }

  /**
   * Verify refresh token
   */
  verifyRefreshToken(token) {
    try {
      const decoded = jwt.verify(token, this.refreshTokenSecret, {
        issuer: 'olawale-store',
        audience: 'olawale-store-client'
      });
      
      if (decoded.type !== 'refresh') {
        throw new Error('Invalid token type');
      }
      
      return {
        valid: true,
        expired: false,
        decoded
      };
    } catch (error) {
      return {
        valid: false,
        expired: error.message === 'jwt expired',
        decoded: null,
        error: error.message
      };
    }
  }

  /**
   * Decode token without verification (for debugging)
   */
  decodeToken(token) {
    try {
      return jwt.decode(token, { complete: true });
    } catch (error) {
      return null;
    }
  }

  /**
   * Get token expiry date
   */
  getTokenExpiry(token) {
    const decoded = this.decodeToken(token);
    if (decoded && decoded.payload.exp) {
      return new Date(decoded.payload.exp * 1000);
    }
    return null;
  }

  /**
   * Check if token is expired
   */
  isTokenExpired(token) {
    const expiry = this.getTokenExpiry(token);
    if (!expiry) return true;
    return expiry < new Date();
  }

  /**
   * Get remaining time until expiry (in seconds)
   */
  getTimeUntilExpiry(token) {
    const expiry = this.getTokenExpiry(token);
    if (!expiry) return 0;
    return Math.max(0, Math.floor((expiry - new Date()) / 1000));
  }

  /**
   * Extract token from Authorization header
   */
  extractTokenFromHeader(authHeader) {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }
    return authHeader.substring(7);
  }

  /**
   * Generate password reset token
   */
  generatePasswordResetToken(userId) {
    const resetToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex');
    
    return {
      resetToken,
      hashedToken,
      expiresAt: new Date(Date.now() + 60 * 60 * 1000) // 1 hour
    };
  }

  /**
   * Hash password reset token
   */
  hashPasswordResetToken(token) {
    return crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');
  }

  /**
   * Generate email verification token
   */
  generateEmailVerificationToken(email) {
    const payload = {
      email,
      type: 'email_verification',
      timestamp: Date.now()
    };
    
    return jwt.sign(payload, this.accessTokenSecret, {
      expiresIn: '24h',
      issuer: 'olawale-store'
    });
  }

  /**
   * Verify email verification token
   */
  verifyEmailVerificationToken(token) {
    try {
      const decoded = jwt.verify(token, this.accessTokenSecret, {
        issuer: 'olawale-store'
      });
      
      if (decoded.type !== 'email_verification') {
        throw new Error('Invalid token type');
      }
      
      return {
        valid: true,
        email: decoded.email
      };
    } catch (error) {
      return {
        valid: false,
        error: error.message
      };
    }
  }
}

module.exports = new JWTService();