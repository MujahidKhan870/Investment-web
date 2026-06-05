const InvestmentPlan = require('../models/InvestmentPlan');
const Investment = require('../models/Investment');
const Wallet = require('../models/Wallet');
const Transaction = require('../models/Transaction');
const Notification = require('../models/Notification');
const Earning = require('../models/Earning');
const { AppError } = require('../middleware/errorMiddleware');

// Get active investment plans
const getPlans = async (req, res, next) => {
  try {
    const plans = await InvestmentPlan.find({ active: true });
    res.status(200).json({
      status: 'success',
      results: plans.length,
      data: {
        plans
      }
    });
  } catch (error) {
    next(error);
  }
};

// Purchase/Subscribe to an Investment Plan
const subscribeToPlan = async (req, res, next) => {
  try {
    const { planId, amount } = req.body;

    if (!planId || !amount) {
      return next(new AppError('Please provide plan ID and investment amount', 400));
    }

    // 1. Find plan
    const plan = await InvestmentPlan.findById(planId);
    if (!plan || !plan.active) {
      return next(new AppError('Selected investment plan is not active or invalid', 404));
    }

    // 2. Validate amount limits
    if (amount < plan.minAmount || amount > plan.maxAmount) {
      return next(new AppError(`Investment amount must be between ₹${plan.minAmount} and ₹${plan.maxAmount}`, 400));
    }

    // 3. Find User's Wallet and verify balance
    const wallet = await Wallet.findOne({ userId: req.user.id });
    if (!wallet || wallet.balance < amount) {
      return next(new AppError('Insufficient wallet balance to purchase this plan', 400));
    }

    // 4. Update Wallet Balance (deduct investment cost)
    wallet.balance = Number((wallet.balance - Number(amount)).toFixed(4));
    await wallet.save();

    // 5. Create Investment record
    const startDate = new Date();
    const endDate = new Date(startDate.getTime() + plan.durationDays * 24 * 60 * 60 * 1000);

    const investment = await Investment.create({
      userId: req.user.id,
      planId: plan._id,
      amount: Number(amount),
      dailyProfitRate: plan.dailyProfitPercentage,
      startDate,
      endDate
    });

    // 6. Log transaction history
    await Transaction.create({
      walletId: wallet._id,
      userId: req.user.id,
      type: 'investment',
      amount: Number(amount),
      status: 'completed',
      description: `Subscription to plan: ${plan.name} (₹${amount})`
    });

    // 7. Notify User
    await Notification.create({
      userId: req.user.id,
      title: 'Investment Active',
      message: `Successfully subscribed to the ${plan.name} plan. Daily returns of ${plan.dailyProfitPercentage}% will start calculating.`,
      type: 'investment'
    });

    res.status(201).json({
      status: 'success',
      message: 'Subscribed to plan successfully',
      data: {
        investment
      }
    });
  } catch (error) {
    next(error);
  }
};

// Fetch user investments list
const getMyInvestments = async (req, res, next) => {
  try {
    const investments = await Investment.find({ userId: req.user.id })
      .populate('planId')
      .sort('-createdAt');

    res.status(200).json({
      status: 'success',
      results: investments.length,
      data: {
        investments
      }
    });
  } catch (error) {
    next(error);
  }
};

// Fetch metrics & charts data for user dashboard
const getInvestmentAnalytics = async (req, res, next) => {
  try {
    const userId = req.user.id;

    // 1. Fetch wallet
    let wallet = await Wallet.findOne({ userId });
    if (!wallet) {
      wallet = await Wallet.create({ userId });
    }

    // 2. Fetch counts
    const activeInvestments = await Investment.find({ userId, status: 'active' });
    const totalActiveCapital = activeInvestments.reduce((acc, curr) => acc + curr.amount, 0);

    // 3. Fetch earnings logs for plotting SVG chart (last 10 daily earning events)
    const earningsHistory = await Earning.find({ userId })
      .populate('investmentId')
      .sort('-calculatedAt')
      .limit(10);

    res.status(200).json({
      status: 'success',
      data: {
        summary: {
          walletBalance: wallet.balance,
          totalEarnings: wallet.totalEarnings,
          dailyEarnings: wallet.dailyEarnings,
          monthlyEarnings: wallet.monthlyEarnings,
          annualEarnings: wallet.annualEarnings,
          activeInvestmentsCount: activeInvestments.length,
          totalInvestedCapital: totalActiveCapital
        },
        earningsHistory
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getPlans,
  subscribeToPlan,
  getMyInvestments,
  getInvestmentAnalytics
};
