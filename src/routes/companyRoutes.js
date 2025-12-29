const express = require('express');
const router = express.Router();
const {
  createCompany,
  getCompanies,
  getCompanyById,
  updateCompany,
  deleteCompany
} = require('../controllers/companyController');
const { protect, authorize } = require('../middleware/authMiddleware');

// All company routes require authentication and admin role
router.post('/', protect, authorize('admin'), createCompany);
router.get('/', protect, getCompanies);
router.get('/:id', protect, getCompanyById);
router.put('/:id', protect, authorize('admin'), updateCompany);
router.delete('/:id', protect, authorize('admin'), deleteCompany);

module.exports = router;
