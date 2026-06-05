const express = require('express');
const { getWallet, depositFunds, requestWithdrawal, getTransactions } = require('../controllers/walletController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(protect);

router.get('/', getWallet);
router.post('/deposit', depositFunds);
router.post('/withdraw', requestWithdrawal);
router.get('/transactions', getTransactions);

module.exports = router;
