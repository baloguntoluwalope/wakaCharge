require('dotenv').config()

const jwt = require('jsonwebtoken')
const User = require('../models/User')
const OTP = require('../models/OTP')
const { createAndSendOTP, verifyOTP } = require('../services/otp.service')
const { createVirtualAccount } = require('../services/nomba.service')
const { sendWelcomeEmail, sendLoginEmail } = require('../utils/email.util')
const { getTrustSummary } = require('../services/trustscore.service')

const generateToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE
  })

const userResponse = (user) => ({
  _id: user._id,
  name: user.name,
  email: user.email,
  phone: user.phone,
  role: user.role,
  campus: user.campus,
  studentId: user.studentId,
  isPhoneVerified: user.isPhoneVerified,
  walletBalance: user.walletBalance,
  virtualAccountNumber: user.virtualAccountNumber,
  virtualAccountBank: user.virtualAccountBank,
  trustScore: user.trustScore,
  trustLevel: user.trustLevel,
  rnplEnabled: user.rnplEnabled,
  rnplLimit: user.rnplLimit,
  rnplOutstanding: user.rnplOutstanding,
  lastLogin: user.lastLogin,
  createdAt: user.createdAt
})

// ─── VA helper — shared by student and admin register ────────────────────────

const provisionVirtualAccount = async (user) => {
  try {
    const account = await createVirtualAccount(user)
    user.virtualAccountNumber = account.bankAccountNumber
    user.virtualAccountBank = account.bankName
    user.virtualAccountReference = account.accountRef
    if (account.isMock) {
      user.walletBalance = (user.walletBalance || 0) + 2000
      console.log('🧪 Mock VA — credited ₦2000 to', user.name)
    }
    await user.save({ validateBeforeSave: false })
    console.log(`✅ Virtual account created for ${user.name}:`, user.virtualAccountNumber)
  } catch (err) {
    console.error('❌ Virtual account creation failed:', err.message)
  }
}

// ─── STUDENT REGISTRATION — STEP 1: Send OTP ─────────────────────────────────

const sendRegistrationOTP = async (req, res) => {
  const { email } = req.body

  if (!email) {
    return res.status(400).json({
      success: false,
      message: 'Please provide your email address'
    })
  }

  const existing = await User.findOne({ email: email.toLowerCase().trim() })
  if (existing) {
    return res.status(409).json({
      success: false,
      message: 'Email already registered. Please login instead.'
    })
  }

  const result = await createAndSendOTP(email.toLowerCase().trim(), 'registration')

  res.status(200).json({
    success: true,
    message: result.message,
    expiresAt: result.expiresAt,
    nextStep: 'Verify your OTP at POST /api/v1/auth/verify-otp'
  })
}

// ─── STUDENT REGISTRATION — STEP 2: Verify OTP ───────────────────────────────

const verifyRegistrationOTP = async (req, res) => {
  const { email, otp } = req.body

  if (!email || !otp) {
    return res.status(400).json({
      success: false,
      message: 'Please provide email and OTP'
    })
  }

  const result = await verifyOTP(
    email.toLowerCase().trim(), otp.trim(), 'registration'
  )

  if (!result.valid) {
    return res.status(400).json({ success: false, message: result.message })
  }

  res.status(200).json({
    success: true,
    message: 'Email verified successfully. Complete your profile.',
    email: email.toLowerCase().trim(),
    nextStep: 'Complete registration at POST /api/v1/auth/complete-registration'
  })
}

// ─── STUDENT REGISTRATION — STEP 3: Complete profile ─────────────────────────

const completeRegistration = async (req, res) => {
  const { email, phone, name, password, campus, studentId } = req.body

  if (!email || !phone || !name || !password || !campus || !studentId) {
    return res.status(400).json({
      success: false,
      message: 'Please provide email, phone, name, password, campus and studentId'
    })
  }

  const otpRecord = await OTP.findOne({
    email: email.toLowerCase().trim(),
    type: 'registration',
    isVerified: true
  })
  if (!otpRecord) {
    return res.status(400).json({
      success: false,
      message: 'Email not verified. Please verify your OTP first.'
    })
  }

  const existingEmail = await User.findOne({ email: email.toLowerCase().trim() })
  if (existingEmail) {
    return res.status(409).json({ success: false, message: 'Email already registered.' })
  }

  const existingPhone = await User.findOne({ phone })
  if (existingPhone) {
    return res.status(409).json({ success: false, message: 'Phone number already registered.' })
  }

  const user = await User.create({
    name: name.trim(),
    email: email.toLowerCase().trim(),
    phone: phone.trim(),
    password,
    campus,
    studentId: studentId.trim(),
    role: 'student',
    isPhoneVerified: true
  })

  await provisionVirtualAccount(user)

  await OTP.deleteOne({ _id: otpRecord._id })

  await sendWelcomeEmail(
    user.email, user.name,
    user.virtualAccountNumber,
    user.virtualAccountBank
  )

  res.status(201).json({
    success: true,
    message: 'Account created successfully! Welcome to Waka Charge ⚡',
    token: generateToken(user._id),
    user: userResponse(user)
  })
}

// ─── STUDENT LOGIN — email + password ────────────────────────────────────────

const loginStudent = async (req, res) => {
  const { email, password } = req.body

  if (!email || !password) {
    return res.status(400).json({
      success: false,
      message: 'Please provide email and password'
    })
  }

  const user = await User.findOne({
    email: email.toLowerCase().trim(),
    role: 'student'
  }).select('+password')

  if (!user || !(await user.comparePassword(password))) {
    return res.status(401).json({
      success: false,
      message: 'Invalid email or password'
    })
  }

  if (!user.isActive) {
    return res.status(401).json({
      success: false,
      message: 'Your account has been deactivated. Contact support.'
    })
  }

  user.lastLogin = new Date()
  await user.save({ validateBeforeSave: false })

  await sendLoginEmail(user.email, user.name)

  res.status(200).json({
    success: true,
    message: 'Login successful. Welcome back!',
    token: generateToken(user._id),
    user: userResponse(user)
  })
}

// ─── RESEND OTP (registration only) ──────────────────────────────────────────

const resendOTP = async (req, res) => {
  const { email, type } = req.body

  if (!email || !type) {
    return res.status(400).json({ success: false, message: 'Please provide email and type' })
  }

  if (!['registration', 'reset'].includes(type)) {
    return res.status(400).json({ success: false, message: 'Invalid OTP type' })
  }

  const lastOTP = await OTP.findOne({
    email: email.toLowerCase().trim(), type
  }).sort({ createdAt: -1 })

  if (lastOTP) {
    const secondsSinceLast = (Date.now() - new Date(lastOTP.createdAt).getTime()) / 1000
    if (secondsSinceLast < 60) {
      return res.status(429).json({
        success: false,
        message: `Please wait ${Math.ceil(60 - secondsSinceLast)} seconds before requesting a new OTP`
      })
    }
  }

  const result = await createAndSendOTP(email.toLowerCase().trim(), type)

  res.status(200).json({
    success: true,
    message: result.message,
    expiresAt: result.expiresAt
  })
}

// ─── ADMIN REGISTER ───────────────────────────────────────────────────────────

const registerAdmin = async (req, res) => {
  const { name, email, phone, password, campus, adminSecret } = req.body

  if (!name || !email || !phone || !password || !campus) {
    return res.status(400).json({
      success: false,
      message: 'Please provide all required fields'
    })
  }

  if (adminSecret !== process.env.ADMIN_REGISTRATION_SECRET) {
    return res.status(403).json({
      success: false,
      message: 'Invalid admin registration secret'
    })
  }

  const existingEmail = await User.findOne({ email: email.toLowerCase().trim() })
  if (existingEmail) {
    return res.status(409).json({ success: false, message: 'Email already registered.' })
  }

  const existingPhone = await User.findOne({ phone })
  if (existingPhone) {
    return res.status(409).json({ success: false, message: 'Phone number already registered.' })
  }

  const user = await User.create({
    name: name.trim(),
    email: email.toLowerCase().trim(),
    phone: phone.trim(),
    password,
    campus,
    role: 'admin'
  })

  await provisionVirtualAccount(user)

  await sendWelcomeEmail(
    user.email, user.name,
    user.virtualAccountNumber,
    user.virtualAccountBank
  )

  res.status(201).json({
    success: true,
    message: 'Admin registered successfully',
    token: generateToken(user._id),
    user: userResponse(user)
  })
}

// ─── ADMIN LOGIN ──────────────────────────────────────────────────────────────

const loginAdmin = async (req, res) => {
  const { email, password } = req.body

  if (!email || !password) {
    return res.status(400).json({ success: false, message: 'Please provide email and password' })
  }

  const user = await User.findOne({
    email: email.toLowerCase().trim(), role: 'admin'
  }).select('+password')

  if (!user || !(await user.comparePassword(password))) {
    return res.status(401).json({ success: false, message: 'Invalid admin credentials' })
  }

  if (!user.isActive) {
    return res.status(401).json({ success: false, message: 'Account has been deactivated' })
  }

  user.lastLogin = new Date()
  await user.save({ validateBeforeSave: false })

  res.status(200).json({
    success: true,
    message: 'Admin login successful',
    token: generateToken(user._id),
    user: userResponse(user)
  })
}

// ─── OPERATOR LOGIN ───────────────────────────────────────────────────────────

const loginOperator = async (req, res) => {
  const { email, password } = req.body

  if (!email || !password) {
    return res.status(400).json({ success: false, message: 'Please provide email and password' })
  }

  const user = await User.findOne({
    email: email.toLowerCase().trim(), role: 'operator'
  }).select('+password')

  if (!user || !(await user.comparePassword(password))) {
    return res.status(401).json({ success: false, message: 'Invalid operator credentials' })
  }

  if (!user.isActive) {
    return res.status(401).json({ success: false, message: 'Account has been deactivated' })
  }

  user.lastLogin = new Date()
  await user.save({ validateBeforeSave: false })

  res.status(200).json({
    success: true,
    message: 'Operator login successful',
    token: generateToken(user._id),
    user: userResponse(user)
  })
}

// ─── PROFILE ──────────────────────────────────────────────────────────────────

const getProfile = async (req, res) => {
  const user = await User.findById(req.user._id)
  if (!user) {
    return res.status(404).json({ success: false, message: 'User not found' })
  }

  let trustProfile = null
  if (user.role === 'student') {
    trustProfile = getTrustSummary(user)
  }

  res.status(200).json({ success: true, user: userResponse(user), trustProfile })
}

const updateProfile = async (req, res) => {
  const { name, phone, studentId } = req.body
  const updates = {}
  if (name) updates.name = name.trim()
  if (phone) updates.phone = phone.trim()
  if (studentId) updates.studentId = studentId.trim()

  if (Object.keys(updates).length === 0) {
    return res.status(400).json({ success: false, message: 'No valid fields to update' })
  }

  if (phone) {
    const existingPhone = await User.findOne({ phone, _id: { $ne: req.user._id } })
    if (existingPhone) {
      return res.status(409).json({ success: false, message: 'Phone number already in use' })
    }
  }

  const user = await User.findByIdAndUpdate(req.user._id, updates, {
    new: true, runValidators: true
  })

  res.status(200).json({
    success: true,
    message: 'Profile updated successfully',
    user: userResponse(user)
  })
}

// ─── LOGOUT ───────────────────────────────────────────────────────────────────

const logout = async (req, res) => {
  res.status(200).json({ success: true, message: 'Logged out successfully' })
}

module.exports = {
  sendRegistrationOTP,
  verifyRegistrationOTP,
  completeRegistration,
  loginStudent,
  resendOTP,
  registerAdmin,
  loginAdmin,
  loginOperator,
  getProfile,
  updateProfile,
  logout
}