const express = require('express');
const router = express.Router();
const { createUser, getAllUsers, resetPassword, getUserById, sendCredentialsEmail, deleteUser } = require('../controllers/userController');
const { protect, authorize } = require('../middleware/authMiddleware');

// All user routes require authentication
// Admin-only routes: create, delete, send credentials, reset password
// Regular users can view their own data
router.post('/', protect, authorize('admin'), createUser);
router.get('/', protect, authorize('admin'), getAllUsers);
// More specific routes first
router.post('/:id/send-credentials', protect, authorize('admin'), sendCredentialsEmail);
router.put('/:id/password', protect, authorize('admin'), resetPassword);
router.get('/:id', protect, getUserById);
router.delete('/:id', protect, authorize('admin'), deleteUser);

module.exports = router;
