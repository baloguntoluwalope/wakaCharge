const crypto = require('crypto')
const OTP = require('../models/OTP')
const transporter = require('../config/email')

// ─────────────────────────────────────────────────
// Generate 6 digit OTP
// ─────────────────────────────────────────────────
const generateOTP = () => {
  return Math.floor(
    100000 + Math.random() * 900000
  ).toString()
}

// ─────────────────────────────────────────────────
// Hash OTP before saving to database
// ─────────────────────────────────────────────────
const hashOTP = (otp) => {
  return crypto
    .createHash('sha256')
    .update(otp)
    .digest('hex')
}

// ─────────────────────────────────────────────────
// Send OTP via Email (Nodemailer — free)
// ─────────────────────────────────────────────────
const sendOTPViaEmail = async (email, otp, type) => {
  const expireMinutes = process.env.OTP_EXPIRE_MINUTES || 5

  const subjects = {
    registration: '⚡ Verify Your Waka Charge Account',
    login:        '🔐 Your Waka Charge Login Code',
    reset:        '🔑 Your Waka Charge Password Reset Code'
  }

  const intros = {
    registration: 'You are almost there! Use this code to verify your phone number and complete your Waka Charge registration.',
    login:        'Use this code to complete your login to Waka Charge.',
    reset:        'Use this code to reset your Waka Charge password.'
  }

  try {
    await transporter.sendMail({
      from: `"Waka Charge ⚡" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: subjects[type] || subjects.registration,
      html: `
        <body style="font-family:Arial,sans-serif;
          background:#f4f6f8;padding:20px;">
          <div style="max-width:500px;margin:0 auto;
            background:#ffffff;border-radius:10px;
            overflow:hidden;">

            <!-- Header -->
            <div style="background:#0D1B2A;
              padding:30px;text-align:center;">
              <h1 style="color:#1DB954;margin:0;">
                ⚡ WAKA CHARGE
              </h1>
              <p style="color:#ffffff;margin:5px 0 0;">
                Campus Energy Rental Platform
              </p>
            </div>

            <!-- Body -->
            <div style="padding:30px;">
              <h2 style="color:#0D1B2A;">
                Verification Code
              </h2>
              <p style="color:#555;line-height:1.6;">
                ${intros[type] || intros.registration}
              </p>

              <!-- OTP Box -->
              <div style="background:#0D1B2A;
                border-radius:12px;padding:30px;
                text-align:center;margin:25px 0;">
                <p style="color:#888;margin:0 0 10px;
                  font-size:13px;letter-spacing:2px;">
                  YOUR VERIFICATION CODE
                </p>
                <h1 style="color:#1DB954;
                  font-size:48px;margin:0;
                  letter-spacing:10px;
                  font-family:monospace;">
                  ${otp}
                </h1>
                <p style="color:#888;margin:15px 0 0;
                  font-size:13px;">
                  Expires in ${expireMinutes} minutes
                </p>
              </div>

              <!-- Warning -->
              <div style="background:#FFF9E6;
                border-left:4px solid #FFC107;
                border-radius:8px;padding:15px;
                margin:20px 0;">
                <p style="margin:0;color:#555;
                  font-size:13px;">
                  🔒 <strong>Never share this code</strong>
                  with anyone. Waka Charge will never ask
                  for your OTP via phone or chat.
                </p>
              </div>

              <p style="color:#555;font-size:13px;">
                If you did not request this code,
                please ignore this email.
              </p>

              <p style="color:#555;margin-top:20px;">
                The Waka Charge Team ⚡
              </p>
            </div>

            <!-- Footer -->
            <div style="background:#0D1B2A;
              padding:15px;text-align:center;">
              <p style="color:#888;margin:0;
                font-size:12px;">
                © 2026 Waka Charge. All rights reserved.
              </p>
            </div>

          </div>
        </body>
      `
    })

    console.log(`✅ OTP email sent to ${email}`)

  } catch (error) {
    console.error(
      '❌ OTP email error:',
      error.message
    )
    throw new Error('Failed to send OTP email')
  }
}

// ─────────────────────────────────────────────────
// Create And Send OTP
// ─────────────────────────────────────────────────
const createAndSendOTP = async (
  email,
  type = 'registration'
) => {
  // Delete any existing OTP for this email
  await OTP.deleteMany({ email, type })

  const otp = generateOTP()
  const hashedOTP = hashOTP(otp)
  const expireMinutes =
    parseInt(process.env.OTP_EXPIRE_MINUTES) || 5
  const expiresAt = new Date(
    Date.now() + expireMinutes * 60 * 1000
  )

  // Save hashed OTP to database
  await OTP.create({
    email,
    otp: hashedOTP,
    type,
    expiresAt
  })

  // Send OTP via email
  await sendOTPViaEmail(email, otp, type)

  // Log in development
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

// ─────────────────────────────────────────────────
// Verify OTP
// ─────────────────────────────────────────────────
const verifyOTP = async (
  email,
  otp,
  type = 'registration'
) => {
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

  // Max 3 attempts
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
      message: `Invalid OTP. ${
        3 - otpRecord.attempts
      } attempts remaining.`
    }
  }

  // Mark as verified
  otpRecord.isVerified = true
  await otpRecord.save()

  return {
    valid: true,
    message: 'OTP verified successfully'
  }
}

module.exports = {
  generateOTP,
  createAndSendOTP,
  verifyOTP
}