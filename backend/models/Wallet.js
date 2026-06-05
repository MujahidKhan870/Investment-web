const mongoose = require('mongoose');

const walletSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Wallet must be linked to a User'],
      unique: true
    },
    balance: {
      type: Number,
      required: true,
      default: 0.0,
      min: [0, 'Balance cannot be negative']
    },
    totalEarnings: {
      type: Number,
      required: true,
      default: 0.0,
      min: [0, 'Total earnings cannot be negative']
    },
    dailyEarnings: {
      type: Number,
      required: true,
      default: 0.0,
      min: [0, 'Daily earnings cannot be negative']
    },
    monthlyEarnings: {
      type: Number,
      required: true,
      default: 0.0,
      min: [0, 'Monthly earnings cannot be negative']
    },
    annualEarnings: {
      type: Number,
      required: true,
      default: 0.0,
      min: [0, 'Annual earnings cannot be negative']
    }
  },
  {
    timestamps: true
  }
);

const Wallet = mongoose.model('Wallet', walletSchema);

module.exports = Wallet;
