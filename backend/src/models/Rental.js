const mongoose = require('mongoose')

const RentalSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    deviceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Device',
      required: true
    },
    stationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Station',
      required: true
    },
    deviceType: { type: String, required: true },
    rentalAmount: { type: Number, required: true },
    depositAmount: { type: Number, required: true },
    totalPaid: { type: Number, required: true },
    selectedHours: { type: Number, required: true },
    startTime: { type: Date, default: Date.now },
    expectedReturnTime: { type: Date, required: true },
    actualReturnTime: { type: Date, default: null },
    confirmationCode: { type: String, required: true },
    operatorConfirmed: { type: Boolean, default: false },
    operatorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    lateFee: { type: Number, default: 0 },
    depositRefunded: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ['active', 'returned', 'overdue', 'cancelled'],
      default: 'active'
    },
    lockerAssigned: { type: String, default: null },
    lockerStatus: {
      type: String,
      enum: ['locked', 'unlocked'],
      default: 'locked'
    },
    damageReport: { type: String, default: null },
    paymentReference: { type: String, default: null }
  },
  { timestamps: true }
)

module.exports = mongoose.model('Rental', RentalSchema)