const mongoose = require('mongoose');
const crypto = require('crypto');

const transactionSchema = new mongoose.Schema(
  {
    walletId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Wallet',
      required: [true, 'Transaction must be linked to a Wallet']
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Transaction must be linked to a User']
    },
    type: {
      type: String,
      enum: ['deposit', 'withdrawal', 'investment', 'earning'],
      required: [true, 'Transaction type is required']
    },
    amount: {
      type: Number,
      required: [true, 'Transaction amount is required'],
      min: [0.01, 'Amount must be greater than 0']
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'completed'],
      default: 'pending'
    },
    transactionReference: {
      type: String,
      unique: true,
      required: true
    },
    description: {
      type: String,
      required: true
    },
    paymentMethod: {
      type: String,
      default: 'Internal Wallet'
    },
    auditHash: {
      type: String
    }
  },
  {
    timestamps: true
  }
);

// Encrypt ledger to ensure records remain immutable
transactionSchema.pre('validate', function (next) {
  if (!this.transactionReference) {
    this.transactionReference = 'TX-' + crypto.randomBytes(8).toString('hex').toUpperCase();
  }

  // Pre-generate cryptographic verification string
  const auditString = `${this.userId}-${this.walletId}-${this.type}-${this.amount}-${this.status}-${this.transactionReference}`;
  this.auditHash = crypto.createHash('sha256').update(auditString).digest('hex');
  next();
});

const Transaction = mongoose.model('Transaction', transactionSchema);

module.exports = Transaction;
