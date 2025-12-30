const express = require('express');
const router = express.Router();
const { createUser, getAllUsers, resetPassword, getUserById, sendCredentialsEmail, deleteUser } = require('../controllers/userController');

// These routes should be protected by auth and admin middleware in production
router.post('/', createUser);
router.get('/', getAllUsers);
// More specific routes first
router.post('/:id/send-credentials', sendCredentialsEmail);
router.put('/:id/password', resetPassword);
router.get('/:id', getUserById);
router.delete('/:id', deleteUser);

module.exports = router;
