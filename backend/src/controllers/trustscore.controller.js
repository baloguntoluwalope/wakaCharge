const User = require('../models/User')
const RNPLDebt = require('../models/RNPLDebt')
const Transaction = require('../models/Transaction')
const {
  getTrustSummary
} = require('../services/trustscore.service')
const { v4: uuidv4 } = require('uuid')

// Get trust score profile
const getTrustScore = async (req, res) => {
  const user = await User.findById(req.user._id)
  const summary = getTrustSummary(user)

  // Get RNPL debt history
  const debts = await RNPLDebt.find({
    userId: req.user._id
  }).sort({ createdAt: -1 }).limit(10)

  res.status(200).json({
    success: true,
    trustProfile: summary,
    rnplHistory: debts
  })
}

// Pay RNPL outstanding balance
const payRNPLDebt = async (req, res) => {
  const user = await User.findById(req.user._id)

  if (user.rnplOutstanding === 0) {
    return res.status(400).json({
      success: false,
      message: 'No outstanding RNPL balance'
    })
  }

  if (user.walletBalance < user.rnplOutstanding) {
    return res.status(400).json({
      success: false,
      message: `Insufficient wallet balance. Need ₦${user.rnplOutstanding} but have ₦${user.walletBalance}. Please fund your wallet.`,
      rnplOutstanding: user.rnplOutstanding,
      walletBalance: user.walletBalance,
      shortfall: user.rnplOutstanding - user.walletBalance
    })
  }

  const amount = user.rnplOutstanding
  const balanceBefore = user.walletBalance
  user.walletBalance -= amount
  user.rnplOutstanding = 0
  user.rnplDueDate = null
  await user.save({ validateBeforeSave: false })

  // Update RNPL debt record
  await RNPLDebt.findOneAndUpdate(
    { userId: user._id, status: 'pending' },
    { status: 'paid', paidAt: new Date() }
  )

  // Record transaction
  await Transaction.create({
    userId: user._id,
    amount,
    type: 'rental_payment',
    status: 'success',
    reference: `RNPL-PAY-${uuidv4().slice(0, 12).toUpperCase()}`,
    provider: 'wallet',
    description: 'RNPL debt repayment',
    balanceBefore,
    balanceAfter: user.walletBalance
  })

  res.status(200).json({
    success: true,
    message: `RNPL balance of ₦${amount} paid successfully.`,
    walletBalance: user.walletBalance,
    rnplOutstanding: 0,
    rnplEnabled: true
  })
}

// Admin — get all students with RNPL
const getRNPLStudents = async (req, res) => {
  const students = await User.find({
    rnplEnabled: true
  }).select(
    'name email phone campus trustScore trustLevel rnplOutstanding rnplDueDate'
  )

  const defaulters = students.filter(
    s => s.rnplOutstanding > 0 &&
    s.rnplDueDate < new Date()
  )

  res.status(200).json({
    success: true,
    total: students.length,
    defaulters: defaulters.length,
    students
  })
}

// Add to trustscore.controller.js

// Backend — GET /api/v1/trust/leaderboard
const getLeaderboard = async (req, res) => {
  const { campus } = req.query

  const filter = {
    role: 'student',
    isActive: true,
    trustScore: { $gt: 0 }
  }

  if (campus) filter.campus = campus

  const leaders = await User.find(filter)
    .select('name campus trustScore trustLevel totalSuccessfulRentals')
    .sort({ trustScore: -1 })
    .limit(20)
    .lean()

  // Anonymise names partially
  const safe = leaders.map((u, i) => ({
    rank: i + 1,
    name: u.name.split(' ')[0] + ' ' + u.name.split(' ').slice(1).map(n => n[0] + '.').join(' '),
    campus: u.campus,
    trustScore: u.trustScore,
    trustLevel: u.trustLevel,
    successfulRentals: u.totalSuccessfulRentals
  }))

  res.status(200).json({
    success: true,
    campus: campus || 'all',
    leaderboard: safe
  })
}
module.exports = {
  getTrustScore,
  payRNPLDebt,
  getRNPLStudents,
  getLeaderboard
}