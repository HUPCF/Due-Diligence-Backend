const express = require('express');
const router = express.Router();
const { login, register, getMe } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

// @route   POST api/auth/login
// @desc    Authenticate user & get token
// @access  Public
router.post('/login', login);

// @route   POST api/auth/register
// @desc    Register user
// @access  Public
router.post('/register', register);

// @route   GET api/auth/me
// @desc    Get user data
// @access  Private
router.get('/me', protect, getMe);

module.exports = router;
