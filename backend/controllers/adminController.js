const User = require('../models/User');
const Wallet = require('../models/Wallet');
const Investment = require('../models/Investment');
const InvestmentPlan = require('../models/InvestmentPlan');
const Transaction = require('../models/Transaction');
const Notification = require('../models/Notification');
const AuditLog = require('../models/AuditLog');
const { calculateDailyEarnings } = require('../services/calculationEngine');
const { AppError } = require('../middleware/errorMiddleware');

// Get overall platform dashboard stats
const getDashboardStats = async (req, res, next) => {
  try {
    const totalUsers = await User.countDocuments({ role: 'user' });
    const activeUsers = await User.countDocuments({ role: 'user', status: 'Active' });
    
    const investments = await Investment.find();
    const totalInvestmentsCount = investments.length;
    const activeInvestmentsCount = investments.filter(inv => inv.status === 'active').length;
    const totalInvestedCapital = investments
      .filter(inv => inv.status === 'active')
      .reduce((sum, inv) => sum + inv.amount, 0);

    const wallets = await Wallet.find();
    const platformReserves = wallets.reduce((sum, w) => sum + w.balance, 0);
    const totalPayouts = wallets.reduce((sum, w) => sum + w.totalEarnings, 0);

    const pendingWithdrawalsCount = await Transaction.countDocuments({ type: 'withdrawal', status: 'pending' });

    res.status(200).json({
      status: 'success',
      data: {
        totalUsers,
        activeUsers,
        totalInvestmentsCount,
        activeInvestmentsCount,
        totalInvestedCapital,
        platformReserves,
        totalPayouts,
        pendingWithdrawalsCount
      }
    });
  } catch (error) {
    next(error);
  }
};

// Get list of all users
const getUsers = async (req, res, next) => {
  try {
    const users = await User.find({ role: 'user' }).sort('-createdAt');
    
    // Enrich users with wallet balance
    const enrichedUsers = await Promise.all(
      users.map(async (user) => {
        const wallet = await Wallet.findOne({ userId: user._id });
        return {
          _id: user._id,
          name: user.name,
          email: user.email,
          status: user.status,
          role: user.role,
          createdAt: user.createdAt,
          balance: wallet ? wallet.balance : 0,
          totalEarnings: wallet ? wallet.totalEarnings : 0
        };
      })
    );

    res.status(200).json({
      status: 'success',
      results: enrichedUsers.length,
      data: {
        users: enrichedUsers
      }
    });
  } catch (error) {
    next(error);
  }
};

// Suspend, Block, or Activate user accounts
const updateUserStatus = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { status } = req.body;

    if (!['Active', 'Suspended', 'Blocked'].includes(status)) {
      return next(new AppError('Invalid status value provided', 400));
    }

    const user = await User.findById(userId);
    if (!user) {
      return next(new AppError('User not found', 404));
    }

    const oldStatus = user.status;
    user.status = status;
    await user.save({ validateBeforeSave: false });

    // Audit Log
    await AuditLog.create({
      actionBy: req.user._id,
      actionType: 'UPDATE_USER_STATUS',
      targetId: user._id,
      oldValues: { status: oldStatus },
      newValues: { status }
    });

    // Notify User
    await Notification.create({
      userId: user._id,
      title: 'Account Status Updated',
      message: `Your account status has been updated to: ${status}.`,
      type: 'security'
    });

    res.status(200).json({
      status: 'success',
      message: `User status successfully updated to ${status}`,
      data: {
        user
      }
    });
  } catch (error) {
    next(error);
  }
};

// Elevate role to Admin
const promoteUser = async (req, res, next) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId);
    if (!user) {
      return next(new AppError('User not found', 404));
    }

    user.role = 'admin';
    await user.save({ validateBeforeSave: false });

    await AuditLog.create({
      actionBy: req.user._id,
      actionType: 'PROMOTE_USER_TO_ADMIN',
      targetId: user._id,
      oldValues: { role: 'user' },
      newValues: { role: 'admin' }
    });

    res.status(200).json({
      status: 'success',
      message: 'User successfully promoted to administrator'
    });
  } catch (error) {
    next(error);
  }
};

// View pending withdrawal requests
const getWithdrawals = async (req, res, next) => {
  try {
    const withdrawals = await Transaction.find({ type: 'withdrawal' })
      .populate('userId', 'name email')
      .sort('-createdAt');

    res.status(200).json({
      status: 'success',
      results: withdrawals.length,
      data: {
        withdrawals
      }
    });
  } catch (error) {
    next(error);
  }
};

// Approve or Reject Withdrawals
const processWithdrawal = async (req, res, next) => {
  try {
    const { transactionId } = req.params;
    const { action } = req.body; // 'approve' or 'reject'

    if (!['approve', 'reject'].includes(action)) {
      return next(new AppError('Action must be approve or reject', 400));
    }

    const tx = await Transaction.findById(transactionId);
    if (!tx || tx.type !== 'withdrawal' || tx.status !== 'pending') {
      return next(new AppError('Invalid withdrawal transaction or transaction is already processed', 400));
    }

    const wallet = await Wallet.findOne({ userId: tx.userId });
    if (!wallet) {
      return next(new AppError('User wallet not found', 404));
    }

    if (action === 'approve') {
      tx.status = 'completed';
      await tx.save();

      await Notification.create({
        userId: tx.userId,
        title: 'Withdrawal Approved',
        message: `Your withdrawal of ₹${tx.amount} has been approved and processed.`,
        type: 'withdrawal'
      });

      // Audit Log
      await AuditLog.create({
        actionBy: req.user._id,
        actionType: 'APPROVE_WITHDRAWAL',
        targetId: tx._id,
        newValues: { status: 'completed' }
      });
    } else {
      tx.status = 'rejected';
      await tx.save();

      // Return locked funds back to wallet balance
      wallet.balance = Number((wallet.balance + tx.amount).toFixed(4));
      await wallet.save();

      await Notification.create({
        userId: tx.userId,
        title: 'Withdrawal Rejected',
        message: `Your withdrawal of ₹${tx.amount} has been rejected. Funds have been returned to your wallet.`,
        type: 'withdrawal'
      });

      // Audit Log
      await AuditLog.create({
        actionBy: req.user._id,
        actionType: 'REJECT_WITHDRAWAL',
        targetId: tx._id,
        newValues: { status: 'rejected' }
      });
    }

    res.status(200).json({
      status: 'success',
      message: `Withdrawal successfully ${action}d`
    });
  } catch (error) {
    next(error);
  }
};

// Create new Investment Plan
const createPlan = async (req, res, next) => {
  try {
    const { name, minAmount, maxAmount, dailyProfitPercentage, durationDays, description } = req.body;

    const newPlan = await InvestmentPlan.create({
      name,
      minAmount,
      maxAmount,
      dailyProfitPercentage,
      durationDays,
      description
    });

    await AuditLog.create({
      actionBy: req.user._id,
      actionType: 'CREATE_PLAN',
      targetId: newPlan._id,
      newValues: newPlan
    });

    res.status(201).json({
      status: 'success',
      data: {
        plan: newPlan
      }
    });
  } catch (error) {
    next(error);
  }
};

// Modify existing Plan
const updatePlan = async (req, res, next) => {
  try {
    const { planId } = req.params;
    const updates = req.body;

    const plan = await InvestmentPlan.findById(planId);
    if (!plan) {
      return next(new AppError('Investment plan not found', 404));
    }

    const oldValues = { ...plan.toObject() };
    Object.assign(plan, updates);
    await plan.save();

    await AuditLog.create({
      actionBy: req.user._id,
      actionType: 'UPDATE_PLAN',
      targetId: plan._id,
      oldValues,
      newValues: updates
    });

    res.status(200).json({
      status: 'success',
      data: {
        plan
      }
    });
  } catch (error) {
    next(error);
  }
};

// Debug trigger for daily profit engine
const triggerCronEarnings = async (req, res, next) => {
  try {
    const result = await calculateDailyEarnings();
    
    await AuditLog.create({
      actionBy: req.user._id,
      actionType: 'TRIGGER_MANUAL_EARNINGS',
      newValues: result
    });

    res.status(200).json({
      status: 'success',
      message: 'Daily earnings calculation processed successfully (Manual override)',
      data: result
    });
  } catch (error) {
    next(error);
  }
};

// View Admin Audits list
const getSystemAuditLogs = async (req, res, next) => {
  try {
    const logs = await AuditLog.find()
      .populate('actionBy', 'name email')
      .sort('-createdAt')
      .limit(100);

    res.status(200).json({
      status: 'success',
      results: logs.length,
      data: {
        logs
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
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
};
