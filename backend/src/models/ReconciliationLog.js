const mongoose = require('mongoose')

const ReconciliationLogSchema = new mongoose.Schema(
  {
    reference: {
      type: String,
      required: true,
      unique: true
    },
    type: {
      type: String,
      enum: [
        'virtual_account_credit',
        'checkout_payment',
        'refund',
        'late_fee'
      ],
      required: true
    },
    expectedAmount: {
      type: Number,
      required: true
    },
    actualAmount: {
      type: Number,
      required: true
    },
    currency: {
      type: String,
      default: 'NGN'
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    transactionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Transaction',
      default: null
    },
    nombaReference: {
      type: String,
      default: null
    },
    walletBalanceBefore: {
      type: Number,
      required: true
    },
    walletBalanceAfter: {
      type: Number,
      required: true
    },
    // Did amounts match?
    isReconciled: {
      type: Boolean,
      default: false
    },
    discrepancy: {
      type: Number,
      default: 0
    },
    discrepancyReason: {
      type: String,
      default: null
    },
    reconciledAt: {
      type: Date,
      default: null
    },
    rawWebhookPayload: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    }
  },
  { timestamps: true }
)

module.exports = mongoose.model(
  'ReconciliationLog',
  ReconciliationLogSchema
)