const crypto = require('crypto')
const OTP = require('../models/OTP')
const { sendOTPEmail } = require('../utils/email.util')

const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

const hashOTP = (otp) => {
  return crypto.createHash('sha256').update(otp).digest('hex')
}

const createAndSendOTP = async (email, type = 'registration') => {
  await OTP.deleteMany({ email, type })

  const otp = generateOTP()
  const hashedOTP = hashOTP(otp)
  const expireMinutes = parseInt(process.env.OTP_EXPIRE_MINUTES) || 5
  const expiresAt = new Date(Date.now() + expireMinutes * 60 * 1000)

  await OTP.create({ email, otp: hashedOTP, type, expiresAt })

  // Send via Brevo SMTP through the shared email util
  await sendOTPEmail(email, otp, type)

  if (process.env.NODE_ENV === 'development') {
    console.log(`🔑 DEV OTP for ${email}: ${otp}`)
  }

  return {
    message: `Verification code sent to ${
      email.slice(0, 3)
    }****${email.slice(email.indexOf('@'))}`,
    expiresAt
  }
}

const verifyOTP = async (email, otp, type = 'registration') => {
  const otpRecord = await OTP.findOne({
    email, type,
    isVerified: false,
    expiresAt: { $gt: new Date() }
  })

  if (!otpRecord) {
    return {
      valid: false,
      message: 'OTP expired or not found. Request a new one.'
    }
  }

  if (otpRecord.attempts >= 3) {
    await OTP.deleteOne({ _id: otpRecord._id })
    return {
      valid: false,
      message: 'Too many failed attempts. Request a new OTP.'
    }
  }

  const hashedInput = hashOTP(otp)

  if (hashedInput !== otpRecord.otp) {
    otpRecord.attempts += 1
    await otpRecord.save()
    return {
      valid: false,
      message: `Invalid OTP. ${3 - otpRecord.attempts} attempts remaining.`
    }
  }

  otpRecord.isVerified = true
  await otpRecord.save()

  return { valid: true, message: 'OTP verified successfully' }
}

module.exports = { generateOTP, createAndSendOTP, verifyOTP }