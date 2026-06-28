const mongoose = require('mongoose')

const RNPLDebtSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    rentalId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Rental',
      required: true
    },
    amount: {
      type: Number,
      required: true
    },
    dueDate: {
      type: Date,
      required: true
    },
    status: {
      type: String,
      enum: ['pending', 'paid', 'overdue', 'defaulted'],
      default: 'pending'
    },
    paidAt: {
      type: Date,
      default: null
    }
  },
  { timestamps: true }
)

module.exports = mongoose.model('RNPLDebt', RNPLDebtSchema)