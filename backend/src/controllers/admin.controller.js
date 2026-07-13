const User = require('../models/User')
const Station = require('../models/Station')
const Device = require('../models/Device')
const Rental = require('../models/Rental')
const Transaction = require('../models/Transaction')
const { sendWelcomeEmail } = require('../utils/email.util')

const getAdminDashboard = async (req, res) => {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const [
    totalStudents, totalOperators,
    totalStations, totalDevices,
    activeRentals, todayRentals,
    overdueRentals, todayTxns,
    weekTxns, monthTxns, rentalsByType
  ] = await Promise.all([
    User.countDocuments({ role: 'student' }),
    User.countDocuments({ role: 'operator' }),
    Station.countDocuments({ isActive: true }),
    Device.countDocuments(),
    Rental.countDocuments({ status: 'active' }),
    Rental.countDocuments({ createdAt: { $gte: today } }),
    Rental.countDocuments({ status: 'overdue' }),
    // Read-only aggregation inputs — .select() + .lean() since we only need type/amount
    Transaction.find({ status: 'success', createdAt: { $gte: today } })
      .select('type amount')
      .lean(),
    Transaction.find({
      status: 'success',
      createdAt: { $gte: new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000) }
    })
      .select('type amount')
      .lean(),
    Transaction.find({
      status: 'success',
      createdAt: { $gte: new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000) }
    })
      .select('type amount')
      .lean(),
    Rental.aggregate([
      { $group: { _id: '$deviceType', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ])
  ])

  const calcRevenue = (txns) =>
    txns
      .filter(t => ['rental_payment', 'late_fee'].includes(t.type))
      .reduce((sum, t) => sum + t.amount, 0)

  const deviceStatus = await Device.aggregate([
    { $group: { _id: '$status', count: { $sum: 1 } } }
  ])

  res.status(200).json({
    success: true,
    dashboard: {
      users: {
        total: totalStudents + totalOperators,
        students: totalStudents,
        operators: totalOperators
      },
      stations: totalStations,
      devices: { total: totalDevices, status: deviceStatus },
      rentals: {
        active: activeRentals,
        today: todayRentals,
        overdue: overdueRentals
      },
      revenue: {
        today: calcRevenue(todayTxns),
        weekly: calcRevenue(weekTxns),
        monthly: calcRevenue(monthTxns)
      },
      analytics: {
        mostRentedDevice: rentalsByType[0]?._id || 'N/A',
        rentalsByType
      }
    }
  })
}

const getAllUsers = async (req, res) => {
  const { role, campus, page = 1, limit = 20 } = req.query
  const filter = {}
  if (role) filter.role = role
  if (campus) filter.campus = campus

  const users = await User.find(filter)
    .select('name email phone campus role trustScore trustLevel walletBalance isActive createdAt')
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(Number(limit))
    .lean()

  const total = await User.countDocuments(filter)

  res.status(200).json({
    success: true,
    count: users.length,
    total,
    users
  })
}

// ─── Create operator from scratch ────────────────────────────────────────────

const createOperator = async (req, res) => {
  const { name, email, phone, password, campus, stationId } = req.body

  if (!name || !email || !phone || !password || !campus) {
    return res.status(400).json({
      success: false,
      message: 'Please provide name, email, phone, password and campus'
    })
  }

  const existing = await User.findOne({ $or: [{ email }, { phone }] })
  if (existing) {
    return res.status(409).json({
      success: false,
      message: 'Email or phone already exists'
    })
  }

  // Validate station if provided
  if (stationId) {
    const station = await Station.findById(stationId)
    if (!station) {
      return res.status(404).json({
        success: false,
        message: 'Station not found'
      })
    }
  }

  const operator = await User.create({
    name, email, phone, password,
    campus, role: 'operator',
    stationId: stationId || null
  })

  res.status(201).json({
    success: true,
    message: 'Operator created successfully',
    operator: {
      _id: operator._id,
      name: operator.name,
      email: operator.email,
      phone: operator.phone,
      campus: operator.campus,
      stationId: operator.stationId,
      role: operator.role
    }
  })
}

// ─── Onboard existing user as operator ───────────────────────────────────────

const onboardOperator = async (req, res) => {
  const { stationId } = req.body
  const user = await User.findById(req.params.id)

  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found'
    })
  }

  if (user.role === 'operator') {
    return res.status(400).json({
      success: false,
      message: 'User is already an operator'
    })
  }

  if (user.role === 'admin') {
    return res.status(400).json({
      success: false,
      message: 'Cannot onboard an admin as operator'
    })
  }

  // Validate station if provided
  if (stationId) {
    const station = await Station.findById(stationId)
    if (!station) {
      return res.status(404).json({
        success: false,
        message: 'Station not found'
      })
    }
  }

  const previousRole = user.role
  user.role = 'operator'
  if (stationId) user.stationId = stationId
  await user.save({ validateBeforeSave: false })

  res.status(200).json({
    success: true,
    message: `${user.name} has been onboarded as an operator`,
    operator: {
      _id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      campus: user.campus,
      stationId: user.stationId,
      role: user.role,
      previousRole
    }
  })
}

// ─── Reassign operator to a different station ─────────────────────────────────

const reassignOperator = async (req, res) => {
  const { stationId } = req.body

  if (!stationId) {
    return res.status(400).json({
      success: false,
      message: 'Please provide stationId'
    })
  }

  const [user, station] = await Promise.all([
    User.findById(req.params.id),
    Station.findById(stationId)
  ])

  if (!user) {
    return res.status(404).json({ success: false, message: 'User not found' })
  }

  if (user.role !== 'operator') {
    return res.status(400).json({
      success: false,
      message: 'User is not an operator'
    })
  }

  if (!station) {
    return res.status(404).json({ success: false, message: 'Station not found' })
  }

  const previousStation = user.stationId
  user.stationId = stationId
  await user.save({ validateBeforeSave: false })

  res.status(200).json({
    success: true,
    message: `${user.name} reassigned to ${station.name}`,
    operator: {
      _id: user._id,
      name: user.name,
      email: user.email,
      campus: user.campus,
      stationId: user.stationId,
      previousStation
    }
  })
}

const getAllRentals = async (req, res) => {
  const { status, page = 1, limit = 20 } = req.query
  const filter = {}
  if (status) filter.status = status

  const rentals = await Rental.find(filter)
    .populate('userId', 'name email phone campus')
    .populate('deviceId', 'deviceType deviceCode')
    .populate('stationId', 'name campus location')
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(Number(limit))
    .lean()

  const total = await Rental.countDocuments(filter)

  res.status(200).json({
    success: true,
    count: rentals.length,
    total,
    rentals
  })
}

const getRevenue = async (req, res) => {
  const { period = '7days' } = req.query
  const days = period === '30days' ? 30 : period === '90days' ? 90 : 7
  const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000)

  const transactions = await Transaction.find({
    status: 'success',
    createdAt: { $gte: startDate },
    type: { $in: ['rental_payment', 'late_fee', 'checkout_payment', 'wallet_funding'] }
  })
    .select('type amount createdAt')
    .sort({ createdAt: 1 })
    .lean()

  const dailyRevenue = {}
  transactions.forEach(t => {
    const day = t.createdAt.toISOString().split('T')[0]
    if (!dailyRevenue[day]) dailyRevenue[day] = 0
    if (['rental_payment', 'late_fee'].includes(t.type)) {
      dailyRevenue[day] += t.amount
    }
  })

  const totalRevenue = Object.values(dailyRevenue).reduce((a, b) => a + b, 0)

  res.status(200).json({
    success: true,
    period,
    totalRevenue,
    dailyRevenue,
    transactions: transactions.length
  })
}

const deactivateUser = async (req, res) => {
  const user = await User.findByIdAndUpdate(
    req.params.id,
    { isActive: false },
    { new: true }
  ).select('name').lean()

  if (!user) {
    return res.status(404).json({ success: false, message: 'User not found' })
  }

  res.status(200).json({
    success: true,
    message: `${user.name}'s account has been deactivated`
  })
}

const activateUser = async (req, res) => {
  const user = await User.findByIdAndUpdate(
    req.params.id,
    { isActive: true },
    { new: true }
  ).select('name').lean()

  if (!user) {
    return res.status(404).json({ success: false, message: 'User not found' })
  }

  res.status(200).json({
    success: true,
    message: `${user.name}'s account has been reactivated`
  })
}

// Add to admin.controller.js

const getAnalytics = async (req, res) => {
  const [
    peakHours,
    campusStats,
    deviceTypePopularity,
    weeklyRevenueTrend
  ] = await Promise.all([

    // Peak rental hours
    Rental.aggregate([
      {
        $group: {
          _id: { $hour: '$startTime' },
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 5 }
    ]),

    // Revenue per campus
    Rental.aggregate([
      { $match: { status: 'returned' } },
      {
        $lookup: {
          from: 'stations',
          localField: 'stationId',
          foreignField: '_id',
          as: 'station'
        }
      },
      { $unwind: '$station' },
      {
        $group: {
          _id: '$station.campus',
          totalRevenue: { $sum: '$rentalAmount' },
          totalRentals: { $sum: 1 }
        }
      },
      { $sort: { totalRevenue: -1 } }
    ]),

    // Most popular device type
    Rental.aggregate([
      {
        $group: {
          _id: '$deviceType',
          count: { $sum: 1 },
          revenue: { $sum: '$rentalAmount' }
        }
      },
      { $sort: { count: -1 } }
    ]),

    // Weekly revenue trend last 7 days
    Transaction.aggregate([
      {
        $match: {
          status: 'success',
          type: 'rental_payment',
          createdAt: {
            $gte: new Date(
              Date.now() - 7 * 24 * 60 * 60 * 1000
            )
          }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: {
              format: '%Y-%m-%d',
              date: '$createdAt'
            }
          },
          revenue: { $sum: '$amount' },
          transactions: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ])
  ])

  res.status(200).json({
    success: true,
    analytics: {
      peakRentalHours: peakHours,
      campusPerformance: campusStats,
      devicePopularity: deviceTypePopularity,
      weeklyTrend: weeklyRevenueTrend
    }
  })
}
const getPendingOperators = async (req, res) => {
  const pending = await User.find({
    role: 'operator',
    approvalStatus: 'pending'
  }).select('-password').sort({ createdAt: -1 })

  res.status(200).json({
    success: true,
    count: pending.length,
    operators: pending
  })
}
module.exports = {
  getAdminDashboard,
  getAllUsers,
  createOperator,
  onboardOperator,
  reassignOperator,
  getAllRentals,
  getRevenue,
  deactivateUser,
  activateUser,
  getAnalytics,
  getpendingOperators
}