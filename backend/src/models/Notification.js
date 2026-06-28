const mongoose = require('mongoose')

const NotificationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    title: { type: String, required: true },
    message: { type: String, required: true },
    type: {
      type: String,
      enum: [
        'payment_success',
        'wallet_funded',
        'rental_started',
        'return_reminder',
        'deposit_refunded',
        'rental_overdue',
        'new_rental',
        'device_returned',
        'device_damaged',
        'low_inventory',
        'general'
      ],
      default: 'general'
    },
    isRead: { type: Boolean, default: false },
    rentalId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Rental',
      default: null
    }
  },
  { timestamps: true }
)

module.exports = mongoose.model('Notification', NotificationSchema)