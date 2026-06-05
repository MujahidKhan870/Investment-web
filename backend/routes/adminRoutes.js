const express = require('express');
const { 
  getDashboardStats, 
  getUsers, 
  updateUserStatus, 
  promoteUser, 
  getWithdrawals, 
  processWithdrawal, 
  createPlan, 
  updatePlan, 
  triggerCronEarnings, 
  getSystemAuditLogs
} = require('../controllers/adminController');
const { protect, restrictTo } = require('../middleware/authMiddleware');

const router = express.Router();

// Restrict all routes in this router to authenticated Admins only
router.use(protect);
router.use(restrictTo('admin'));

router.get('/stats', getDashboardStats);
router.get('/users', getUsers);
router.patch('/users/:userId/status', updateUserStatus);
router.patch('/users/:userId/promote', promoteUser);

router.get('/withdrawals', getWithdrawals);
router.patch('/withdrawals/:transactionId', processWithdrawal);

router.post('/plans', createPlan);
router.patch('/plans/:planId', updatePlan);

router.post('/trigger-earnings', triggerCronEarnings);
router.get('/audit-logs', getSystemAuditLogs);

module.exports = router;
