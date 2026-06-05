const express = require('express');
const { 
  register, 
  login, 
  logout, 
  refreshToken, 
  verifyEmail, 
  forgotPassword, 
  resetPassword,
  getSessions,
  revokeSession
} = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');
const { authLimiter } = require('../middleware/rateLimiter');

const router = express.Router();

// Public routes (Rate limited to prevent brute force)
router.post('/register', authLimiter, register);
router.post('/login', authLimiter, login);
router.post('/logout', logout);
router.post('/refresh-token', refreshToken);
router.post('/verify-email', verifyEmail);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

// Protected session management
router.use(protect);
router.get('/sessions', getSessions);
router.delete('/sessions/:sessionId', revokeSession);

module.exports = router;
