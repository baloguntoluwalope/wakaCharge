const mongoose = require('mongoose')

const OTPSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true
    },
    otp: {
      type: String,
      required: true
    },
    type: {
      type: String,
      enum: ['registration', 'login', 'reset'],
      default: 'registration'
    },
    isVerified: {
      type: Boolean,
      default: false
    },
    attempts: {
      type: Number,
      default: 0
    },
    expiresAt: {
      type: Date,
      required: true
    }
  },
  { timestamps: true }
)

// Auto delete expired OTPs from database
OTPSchema.index(
  { expiresAt: 1 },
  { expireAfterSeconds: 0 }
)

module.exports = mongoose.model('OTP', OTPSchema)