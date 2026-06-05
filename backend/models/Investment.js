const mongoose = require('mongoose');

const investmentSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Investment must be linked to a User']
    },
    planId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'InvestmentPlan',
      required: [true, 'Investment must be linked to an Investment Plan']
    },
    amount: {
      type: Number,
      required: [true, 'Please provide investment amount'],
      min: [1, 'Investment amount must be at least 1']
    },
    dailyProfitRate: {
      type: Number,
      required: true
    },
    status: {
      type: String,
      enum: ['active', 'expired', 'suspended'],
      default: 'active'
    },
    startDate: {
      type: Date,
      default: Date.now
    },
    endDate: {
      type: Date,
      required: true
    },
    lastProfitCalculationDate: {
      type: Date,
      default: null
    },
    totalProfitGenerated: {
      type: Number,
      default: 0.0
    }
  },
  {
    timestamps: true
  }
);

const Investment = mongoose.model('Investment', investmentSchema);

module.exports = Investment;
