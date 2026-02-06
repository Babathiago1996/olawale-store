const express = require('express');
const authController = require('../controllers/auth.controller');
const { authenticate, checkRateLimit } = require('../middleware/auth');

const router = express.Router();

// Public routes
router.post('/register', authController.register);
router.post('/login', checkRateLimit(5, 15 * 60 * 1000), authController.login);
router.post('/refresh-token', authController.refreshToken);
router.post('/request-password-reset', checkRateLimit(3, 15 * 60 * 1000), authController.requestPasswordReset);
router.post('/verify-otp', authController.verifyPasswordResetOTP);
router.post('/reset-password', authController.resetPassword);

// Protected routes
router.use(authenticate);

router.post('/logout', authController.logout);
router.post('/logout-all', authController.logoutAll);
router.post('/change-password', authController.changePassword);
router.get('/me', authController.getCurrentUser);

module.exports = router;