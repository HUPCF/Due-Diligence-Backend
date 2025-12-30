const express = require('express');
const router = express.Router();
const { createUser, getAllUsers, resetPassword, getUserById, sendCredentialsEmail, deleteUser } = require('../controllers/userController');
const { protect, authorize } = require('../middleware/authMiddleware');

// All user routes require authentication
// Admin-only routes: create, delete, send credentials, reset password
// Regular users can view their own data

// More specific routes first (before generic :id routes)
router.post('/:id/send-credentials', protect, authorize('admin'), (req, res, next) => {
  console.log('=== Route handler for send-credentials called ===');
  console.log('User ID:', req.params.id);
  console.log('Request body:', req.body);
  next();
}, sendCredentialsEmail);

router.post('/', protect, authorize('admin'), createUser);
router.get('/', protect, authorize('admin'), getAllUsers);
router.put('/:id/password', protect, authorize('admin'), resetPassword);
router.get('/:id', protect, getUserById);
router.delete('/:id', protect, authorize('admin'), deleteUser);

module.exports = router;
