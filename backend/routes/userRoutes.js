const express = require('express');
const { getMe, updateMe, changePassword, getMyActivityLogs } = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(protect);

router.get('/me', getMe);
router.patch('/update-me', updateMe);
router.patch('/change-password', changePassword);
router.get('/activity-logs', getMyActivityLogs);

module.exports = router;
