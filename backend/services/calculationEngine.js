const Investment = require('../models/Investment');
const Wallet = require('../models/Wallet');
const Earning = require('../models/Earning');
const Transaction = require('../models/Transaction');
const Notification = require('../models/Notification');
const logger = require('../utils/logger');

const calculateDailyEarnings = async () => {
  logger.info('Starting daily earnings calculation engine...');

  const todayStr = new Date().toISOString().split('T')[0]; // Format: YYYY-MM-DD
  const now = new Date();

  // Find all active investments
  const activeInvestments = await Investment.find({ status: 'active' }).populate('planId');
  
  let processedCount = 0;
  let skippedCount = 0;
  let totalPayout = 0;

  for (const investment of activeInvestments) {
    try {
      // 1. Double check plan configuration
      if (!investment.planId) {
        logger.warn(`Investment ${investment._id} does not have a linked plan. Skipping.`);
        continue;
      }

      // 2. Check if plan is expired
      if (now > investment.endDate) {
        investment.status = 'expired';
        await investment.save();
        
        await Notification.create({
          userId: investment.userId,
          title: 'Investment Plan Expired',
          message: `Your investment of $${investment.amount} on the ${investment.planId.name} plan has completed its term.`,
          type: 'investment'
        });
        
        logger.info(`Investment ${investment._id} marked as expired.`);
        skippedCount++;
        continue;
      }

      // 3. Idempotency Check: check if earnings have already been calculated for this investment today
      const existingEarning = await Earning.findOne({
        investmentId: investment._id,
        periodDate: todayStr
      });

      if (existingEarning) {
        logger.info(`Earnings already calculated for investment ${investment._id} on ${todayStr}. Skipping.`);
        skippedCount++;
        continue;
      }

      // 4. Calculate Earnings
      const dailyRate = investment.dailyProfitRate; // already matches planId.dailyProfitPercentage
      const payoutAmount = Number((investment.amount * (dailyRate / 100)).toFixed(4));

      // 5. Update user's wallet
      const wallet = await Wallet.findOne({ userId: investment.userId });
      if (!wallet) {
        logger.error(`Wallet not found for user ${investment.userId}. Skipping.`);
        continue;
      }

      wallet.balance = Number((wallet.balance + payoutAmount).toFixed(4));
      wallet.totalEarnings = Number((wallet.totalEarnings + payoutAmount).toFixed(4));
      wallet.dailyEarnings = payoutAmount; // updates last daily earning
      wallet.monthlyEarnings = Number((wallet.monthlyEarnings + payoutAmount).toFixed(4));
      wallet.annualEarnings = Number((wallet.annualEarnings + payoutAmount).toFixed(4));
      await wallet.save();

      // 6. Create Earning Record
      await Earning.create({
        userId: investment.userId,
        investmentId: investment._id,
        amount: payoutAmount,
        percentageApplied: dailyRate,
        periodDate: todayStr
      });

      // 7. Write ledger Transaction record
      await Transaction.create({
        walletId: wallet._id,
        userId: investment.userId,
        type: 'earning',
        amount: payoutAmount,
        status: 'completed',
        description: `Daily profit payout for ${investment.planId.name} investment`,
        paymentMethod: 'Internal Ledger'
      });

      // 8. Update Investment record
      investment.totalProfitGenerated = Number((investment.totalProfitGenerated + payoutAmount).toFixed(4));
      investment.lastProfitCalculationDate = now;
      await investment.save();

      // 9. Send Notification
      await Notification.create({
        userId: investment.userId,
        title: 'Daily Earnings Credited',
        message: `Your daily returns of $${payoutAmount} have been credited to your wallet for the ${investment.planId.name} plan.`,
        type: 'earning'
      });

      totalPayout += payoutAmount;
      processedCount++;
    } catch (err) {
      logger.error(`Error processing earnings for investment ${investment._id}:`, err.message);
    }
  }

  logger.info(`Earnings Engine run complete. Processed: ${processedCount}, Skipped/Expired: ${skippedCount}, Total Payout: $${totalPayout}`);
  return {
    success: true,
    processedCount,
    skippedCount,
    totalPayout
  };
};

module.exports = {
  calculateDailyEarnings
};
