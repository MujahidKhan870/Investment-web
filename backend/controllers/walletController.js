const Wallet = require('../models/Wallet');
const Transaction = require('../models/Transaction');
const Notification = require('../models/Notification');
const { AppError } = require('../middleware/errorMiddleware');

// Get wallet balance and summaries
const getWallet = async (req, res, next) => {
  try {
    let wallet = await Wallet.findOne({ userId: req.user.id });
    if (!wallet) {
      wallet = await Wallet.create({ userId: req.user.id });
    }
    res.status(200).json({
      status: 'success',
      data: {
        wallet
      }
    });
  } catch (error) {
    next(error);
  }
};

// Simulate deposit (increases balance immediately and logs transaction)
const depositFunds = async (req, res, next) => {
  try {
    const { amount, paymentMethod } = req.body;

    if (!amount || amount <= 0) {
      return next(new AppError('Please provide a valid deposit amount', 400));
    }

    let wallet = await Wallet.findOne({ userId: req.user.id });
    if (!wallet) {
      wallet = await Wallet.create({ userId: req.user.id });
    }

    // Process simulation
    wallet.balance = Number((wallet.balance + Number(amount)).toFixed(4));
    await wallet.save();

    // Create completed Transaction log
    const transaction = await Transaction.create({
      walletId: wallet._id,
      userId: req.user.id,
      type: 'deposit',
      amount: Number(amount),
      status: 'completed',
      paymentMethod: paymentMethod || 'Mock Stripe Checkout',
      description: `Simulated wallet deposit via ${paymentMethod || 'Mock Stripe'}`
    });

    // Notify user
    await Notification.create({
      userId: req.user.id,
      title: 'Funds Deposited',
      message: `₹${amount} has been successfully credited to your wallet via simulated ${paymentMethod || 'gateway'}.`,
      type: 'info'
    });

    res.status(200).json({
      status: 'success',
      message: 'Deposit successful (Simulated)',
      data: {
        wallet,
        transaction
      }
    });
  } catch (error) {
    next(error);
  }
};

// Request withdrawal (locks funds in pending state)
const requestWithdrawal = async (req, res, next) => {
  try {
    const { amount, paymentMethod, accountDetails } = req.body;

    if (!amount || amount <= 0) {
      return next(new AppError('Please provide a valid withdrawal amount', 400));
    }

    const wallet = await Wallet.findOne({ userId: req.user.id });
    if (!wallet || wallet.balance < amount) {
      return next(new AppError('Insufficient wallet balance to request withdrawal', 400));
    }

    // Lock funds: subtract from active balance
    wallet.balance = Number((wallet.balance - Number(amount)).toFixed(4));
    await wallet.save();

    // Create pending Transaction
    const transaction = await Transaction.create({
      walletId: wallet._id,
      userId: req.user.id,
      type: 'withdrawal',
      amount: Number(amount),
      status: 'pending',
      paymentMethod: paymentMethod || 'Bank Transfer',
      description: `Withdrawal request to account: ${accountDetails || 'Default bank'}`
    });

    // Create in-app Notification
    await Notification.create({
      userId: req.user.id,
      title: 'Withdrawal Requested',
      message: `Your request to withdraw ₹${amount} is pending admin approval.`,
      type: 'withdrawal'
    });

    res.status(200).json({
      status: 'success',
      message: 'Withdrawal request submitted. Pending admin review.',
      data: {
        wallet,
        transaction
      }
    });
  } catch (error) {
    next(error);
  }
};

// Get transaction history
const getTransactions = async (req, res, next) => {
  try {
    const transactions = await Transaction.find({ userId: req.user.id }).sort('-createdAt');
    res.status(200).json({
      status: 'success',
      results: transactions.length,
      data: {
        transactions
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getWallet,
  depositFunds,
  requestWithdrawal,
  getTransactions
};
