const express = require('express');
const { getPlans, subscribeToPlan, getMyInvestments, getInvestmentAnalytics } = require('../controllers/investmentController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(protect);

router.get('/plans', getPlans);
router.post('/subscribe', subscribeToPlan);
router.get('/my-investments', getMyInvestments);
router.get('/analytics', getInvestmentAnalytics);

module.exports = router;
