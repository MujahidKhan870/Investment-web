const mongoose = require('mongoose');

const investmentPlanSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please provide plan name'],
      unique: true,
      trim: true
    },
    minAmount: {
      type: Number,
      required: [true, 'Please provide minimum investment amount'],
      min: [0, 'Min amount cannot be negative']
    },
    maxAmount: {
      type: Number,
      required: [true, 'Please provide maximum investment amount'],
      min: [0, 'Max amount cannot be negative']
    },
    dailyProfitPercentage: {
      type: Number,
      required: [true, 'Please provide daily profit percentage'],
      min: [0, 'Daily profit percentage cannot be negative']
    },
    durationDays: {
      type: Number,
      required: [true, 'Please provide plan duration in days'],
      min: [1, 'Plan duration must be at least 1 day']
    },
    description: {
      type: String,
      required: [true, 'Please provide plan description']
    },
    active: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true
  }
);

const InvestmentPlan = mongoose.model('InvestmentPlan', investmentPlanSchema);

module.exports = InvestmentPlan;
