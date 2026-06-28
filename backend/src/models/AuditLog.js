const mongoose = require('mongoose')

const AuditLogSchema = new mongoose.Schema(
  {
    // Who did it
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    // What role
    role: {
      type: String,
      enum: ['student', 'operator', 'admin', 'system'],
      default: 'system'
    },
    // What action
    action: {
      type: String,
      required: true,
      enum: [
        // Auth
        'USER_REGISTERED',
        'USER_LOGIN',
        'USER_LOGOUT',
        'OTP_SENT',
        'OTP_VERIFIED',
        'OTP_FAILED',
        // Payments
        'WALLET_FUNDED',
        'CHECKOUT_INITIATED',
        'CHECKOUT_VERIFIED',
        'WEBHOOK_RECEIVED',
        'WEBHOOK_DUPLICATE',
        'WEBHOOK_FAILED',
        'PAYMENT_FAILED',
        // Rentals
        'RENTAL_STARTED',
        'RENTAL_RETURN_INITIATED',
        'RENTAL_RETURNED',
        'RENTAL_OVERDUE',
        'RENTAL_CANCELLED',
        'DEPOSIT_REFUNDED',
        'LATE_FEE_CHARGED',
        // Operator
        'OPERATOR_CLOCK_IN',
        'OPERATOR_CLOCK_OUT',
        'OPERATOR_CONFIRMED_RETURN',
        'DEVICE_REPORTED_DAMAGED',
        // Admin
        'OPERATOR_CREATED',
        'USER_DEACTIVATED',
        'STATION_CREATED',
        'DEVICE_ADDED',
        // Trust
        'TRUST_SCORE_INCREASED',
        'TRUST_SCORE_DECREASED',
        'RNPL_UNLOCKED',
        'RNPL_DEBT_CREATED',
        'RNPL_DEBT_PAID'
      ]
    },
    // What resource was affected
    resourceType: {
      type: String,
      enum: [
        'User', 'Rental', 'Transaction',
        'Device', 'Station', 'OTP',
        'RNPLDebt', 'Webhook'
      ],
      default: null
    },
    resourceId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null
    },
    // What changed
    previousState: {
      type: mongoose.Schema.Types.Mixed,
      default: null
    },
    newState: {
      type: mongoose.Schema.Types.Mixed,
      default: null
    },
    // Extra context
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    },
    // Request info
    ipAddress: {
      type: String,
      default: null
    },
    userAgent: {
      type: String,
      default: null
    },
    // Result
    status: {
      type: String,
      enum: ['success', 'failed', 'warning'],
      default: 'success'
    },
    errorMessage: {
      type: String,
      default: null
    }
  },
  { timestamps: true }
)

// Index for fast queries
AuditLogSchema.index({ userId: 1, createdAt: -1 })
AuditLogSchema.index({ action: 1, createdAt: -1 })
AuditLogSchema.index({ resourceType: 1, resourceId: 1 })

module.exports = mongoose.model('AuditLog', AuditLogSchema)