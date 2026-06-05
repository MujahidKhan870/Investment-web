const express = require('express');
const { exportUsers, exportInvestments, exportTransactions, exportEarnings, exportAudits } = require('../controllers/reportController');
const { protect, restrictTo } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(protect);

// Users and Admin can export their transaction/earnings logs (filtered in controller)
router.get('/transactions', exportTransactions);
router.get('/earnings', exportEarnings);

// Restricted to Admins only
router.get('/users', restrictTo('admin'), exportUsers);
router.get('/investments', restrictTo('admin'), exportInvestments);
router.get('/audit-logs', restrictTo('admin'), exportAudits);

module.exports = router;
