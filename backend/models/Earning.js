const mongoose = require('mongoose');

const earningSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Earning must be linked to a User']
    },
    investmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Investment',
      required: [true, 'Earning must be linked to an Investment']
    },
    amount: {
      type: Number,
      required: true,
      min: [0, 'Earning amount cannot be negative']
    },
    percentageApplied: {
      type: Number,
      required: true
    },
    calculatedAt: {
      type: Date,
      default: Date.now
    },
    periodDate: {
      type: String, // format YYYY-MM-DD
      required: true
    }
  },
  {
    timestamps: true
  }
);

// Prevent duplicate profit calculations for the same investment on the same calendar day
earningSchema.index({ investmentId: 1, periodDate: 1 }, { unique: true });

const Earning = mongoose.model('Earning', earningSchema);

module.exports = Earning;
