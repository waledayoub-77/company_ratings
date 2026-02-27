const express = require('express');
const router = express.Router();
const { register, login, refresh, logout, getMe, updateMe, verifyEmail, forgotPassword, resetPassword, changePassword, deactivateAccount, deleteAccount } = require('../controllers/authController');
const { validateRegister, validateLogin } = require('../utils/validators');
const { validate } = require('../middlewares/validateMiddleware');
const { authLimiter } = require('../middlewares/rateLimiter');
const { requireAuth } = require('../middlewares/authMiddleware');

// Public routes
router.post('/register', authLimiter, validateRegister, validate, register);
router.post('/login', authLimiter, validateLogin, validate, login);
router.post('/refresh-token', authLimiter, refresh);
router.get('/verify-email/:token', verifyEmail);
router.post('/forgot-password', authLimiter, forgotPassword);
router.post('/reset-password/:token', resetPassword);

// Protected routes
router.post('/logout', requireAuth, logout);
router.get('/me', requireAuth, getMe);
router.post('/change-password', requireAuth, changePassword);
router.patch('/me', requireAuth, updateMe);
router.patch('/me/deactivate', requireAuth, deactivateAccount);
router.delete('/me', requireAuth, deleteAccount);

module.exports = router;
