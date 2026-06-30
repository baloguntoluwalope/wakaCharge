const mongoose = require('mongoose')

const DeviceSchema = new mongoose.Schema(
  {
    stationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Station',
      required: true
    },
    deviceType: {
      type: String,
      required: true,
      enum: ['powerbank', 'studylamp', 'survivalkit', 'comfortkit']
    },
    deviceCode: { type: String, unique: true, required: true },
    status: {
      type: String,
      enum: ['available', 'rented', 'damaged', 'charging'],
      default: 'available'
    },
    rentalPrice: { type: Number, required: true },
    depositAmount: { type: Number, required: true },
    maxHours: { type: Number, required: true },
    currentRentalId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Rental',
      default: null
    },
    condition: {
      type: String,
      enum: ['excellent', 'good', 'fair', 'poor'],
      default: 'excellent'
    },
    totalRentals: { type: Number, default: 0 },
    notes: { type: String, default: '' },
    batteryLevel: {
      type: Number,
      min: 0,
      max: 100,
      default: 100
    },
    lastMaintenanceDate: {
      type: Date,
      default: Date.now
    },
    totalCycles: {
      type: Number,
      default: 0
    },
    needsMaintenance: {
      type: Boolean,
      default: false
    }
  },
  { timestamps: true }
)

module.exports = mongoose.model('Device', DeviceSchema)