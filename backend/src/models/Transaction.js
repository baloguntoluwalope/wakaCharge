const mongoose = require('mongoose')

const TransactionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    rentalId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Rental',
      default: null
    },
    amount: { type: Number, required: true },
    type: {
      type: String,
      enum: [
        'wallet_funding',
        'rental_payment',
        'deposit_hold',
        'deposit_refund',
        'late_fee',
        'checkout_payment'
      ],
      required: true
    },
    status: {
      type: String,
      enum: ['pending', 'success', 'failed'],
      default: 'pending'
    },
    reference: { type: String, unique: true, required: true },
    provider: {
      type: String,
      enum: [
        'nomba_virtual_account',
        'nomba_checkout',
        'wallet'
      ],
      required: true
    },
    description: { type: String, default: '' },
    balanceBefore: { type: Number, default: 0 },
    balanceAfter: { type: Number, default: 0 },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} }
  },
  { timestamps: true }
)

module.exports = mongoose.model('Transaction', TransactionSchema)