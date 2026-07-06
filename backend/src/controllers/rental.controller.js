require('dotenv').config()

const mongoose = require('mongoose')
const { v4: uuidv4 } = require('uuid')

const Rental = require('../models/Rental')
const Device = require('../models/Device')
const Station = require('../models/Station')
const User = require('../models/User')
const Transaction = require('../models/Transaction')
const Notification = require('../models/Notification')

const {
  sendRentalStartedEmail,
  sendDepositRefundedEmail
} = require('../utils/email.util')

const {
  createAuditLog
} = require('../services/audit.service')

const {
  rewardSuccessfulReturn,
  penaliseLateReturn
} = require('../services/trustscore.service')

const { cache } = require('../services/cache.service')

// ─────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────
const generateCode = () =>
  Math.floor(1000 + Math.random() * 9000).toString()

const assignLocker = (deviceType) => {
  const prefix = {
    powerbank: 'PB',
    studylamp: 'SL',
    survivalkit: 'SK',
    comfortkit: 'CK'
  }
  return `${prefix[deviceType] || 'DV'}-${
    Math.floor(Math.random() * 10) + 1
  }`
}

// ─────────────────────────────────────────────────
// START RENTAL
// POST /api/v1/rentals
// ─────────────────────────────────────────────────
const startRental = async (req, res) => {
  const {
    stationId,
    deviceType,
    selectedHours,
    useRNPL = false
  } = req.body
  const userId = req.user._id

  // Validate required fields
  if (!stationId || !deviceType || !selectedHours) {
    return res.status(400).json({
      success: false,
      message: 'Please provide stationId, deviceType and selectedHours'
    })
  }

  // Find available device at station
  const device = await Device.findOne({
    stationId,
    deviceType,
    status: 'available'
  })

  if (!device) {
    return res.status(404).json({
      success: false,
      message: `No available ${deviceType} at this station. Please try another station.`
    })
  }

  // Validate station
  const station = await Station.findById(stationId)
  if (!station || !station.isActive) {
    return res.status(404).json({
      success: false,
      message: 'Station not found or currently inactive'
    })
  }

  // Validate hours
  if (selectedHours < 1 || selectedHours > device.maxHours) {
    return res.status(400).json({
      success: false,
      message: `Selected hours must be between 1 and ${device.maxHours} for ${deviceType}`
    })
  }

  const student = await User.findById(userId)
  const totalCost = device.rentalPrice + device.depositAmount

  // ── RNPL Flow ──────────────────────────────────
  if (useRNPL) {
    if (!student.rnplEnabled) {
      return res.status(400).json({
        success: false,
        message: `RNPL not available yet. Complete ${
          Math.max(0, 10 - student.totalSuccessfulRentals)
        } more successful rentals to unlock Rent Now Pay Later.`,
        trustScore: student.trustScore,
        totalSuccessfulRentals: student.totalSuccessfulRentals,
        required: 10
      })
    }

    if (student.rnplOutstanding > 0) {
      return res.status(400).json({
        success: false,
        message: `You have an outstanding RNPL balance of ₦${student.rnplOutstanding.toLocaleString()}. Please clear it before renting again.`,
        rnplOutstanding: student.rnplOutstanding,
        rnplDueDate: student.rnplDueDate
      })
    }

    if (totalCost > student.rnplLimit) {
      return res.status(400).json({
        success: false,
        message: `Rental cost ₦${totalCost} exceeds your RNPL limit of ₦${student.rnplLimit}.`,
        totalCost,
        rnplLimit: student.rnplLimit
      })
    }

    // RNPL session
    const session = await mongoose.startSession()
    session.startTransaction()

    try {
      const startTime = new Date()
      const expectedReturnTime = new Date(
        startTime.getTime() + selectedHours * 60 * 60 * 1000
      )
      const confirmationCode = generateCode()
      const lockerAssigned = assignLocker(deviceType)
      const dueDate = new Date(
        Date.now() + 48 * 60 * 60 * 1000
      )

      // Update student RNPL fields
      student.rnplOutstanding = totalCost
      student.rnplDueDate = dueDate
      await student.save({
        validateBeforeSave: false,
        session
      })

      // Create rental
      const rental = await Rental.create(
        [{
          userId,
          deviceId: device._id,
          stationId,
          deviceType,
          rentalAmount: device.rentalPrice,
          depositAmount: device.depositAmount,
          totalPaid: totalCost,
          selectedHours,
          startTime,
          expectedReturnTime,
          confirmationCode,
          lockerAssigned,
          lockerStatus: 'unlocked',
          status: 'active',
          paymentReference: `RNPL-${uuidv4().slice(0, 12).toUpperCase()}`,
          metadata: { paymentType: 'RNPL', dueDate }
        }],
        { session }
      )

      // Update device
      await Device.findByIdAndUpdate(
        device._id,
        {
          status: 'rented',
          currentRentalId: rental[0]._id,
          $inc: { totalRentals: 1 }
        },
        { session }
      )

      // Create RNPL debt transaction — pending
      await Transaction.create(
        [{
          userId,
          rentalId: rental[0]._id,
          amount: totalCost,
          type: 'rental_payment',
          status: 'pending',
          reference: rental[0].paymentReference,
          provider: 'wallet',
          description: `RNPL — ${deviceType} rental ${selectedHours}hrs. Due: ${dueDate.toLocaleDateString()}`,
          balanceBefore: student.walletBalance,
          balanceAfter: student.walletBalance,
          metadata: {
            paymentType: 'RNPL',
            dueDate
          }
        }],
        { session }
      )

      await session.commitTransaction()

      // Invalidate caches — wallet unaffected here (RNPL is debt, not deducted),
      // but station inventory changed (device now rented) and a new pending txn exists
      cache.invalidate(`station:${stationId}`)
      cache.invalidate(`txns:${userId}:1`)

      // Audit log
      await createAuditLog({
        userId,
        role: 'student',
        action: 'RENTAL_STARTED',
        resourceType: 'Rental',
        resourceId: rental[0]._id,
        metadata: {
          deviceType, selectedHours, totalCost,
          lockerAssigned, paymentType: 'RNPL', dueDate
        },
        ipAddress: req.ip,
        status: 'success'
      })

      await Notification.create({
        userId,
        title: '⚡ RNPL Rental Started',
        message: `Your ${deviceType} rental started via RNPL. Pay ₦${totalCost.toLocaleString()} by ${dueDate.toLocaleDateString()}.`,
        type: 'rental_started',
        rentalId: rental[0]._id
      })

      cache.invalidate(`notifs:${userId}`)

      return res.status(201).json({
        success: true,
        message: 'RNPL rental started successfully',
        rental: {
          _id: rental[0]._id,
          deviceType,
          rentalAmount: device.rentalPrice,
          depositAmount: device.depositAmount,
          totalPaid: totalCost,
          selectedHours,
          startTime,
          expectedReturnTime,
          confirmationCode,
          lockerAssigned,
          lockerStatus: 'unlocked',
          status: 'active',
          paymentType: 'RNPL'
        },
        locker: {
          assigned: lockerAssigned,
          status: 'UNLOCKED ✅',
          message: `Locker ${lockerAssigned} is open. Collect your ${deviceType}.`
        },
        rnpl: {
          amount: totalCost,
          dueDate,
          message: `Pay ₦${totalCost.toLocaleString()} within 48 hours to keep your RNPL access.`
        },
        walletBalance: student.walletBalance
      })

    } catch (error) {
      await session.abortTransaction()

      await createAuditLog({
        userId,
        role: 'student',
        action: 'RENTAL_STARTED',
        metadata: {
          deviceType, selectedHours, totalCost,
          paymentType: 'RNPL'
        },
        status: 'failed',
        errorMessage: error.message
      })

      throw error
    } finally {
      session.endSession()
    }
  }

  // ── Normal Wallet Payment Flow ─────────────────
  if (student.walletBalance < totalCost) {
    return res.status(400).json({
      success: false,
      message: `Insufficient wallet balance. You need ₦${totalCost.toLocaleString()} but have ₦${student.walletBalance.toLocaleString()}.`,
      required: totalCost,
      available: student.walletBalance,
      shortfall: totalCost - student.walletBalance,
      tip: 'Fund your wallet via your Nomba virtual account or Checkout.'
    })
  }

  const session = await mongoose.startSession()
  session.startTransaction()

  try {
    const startTime = new Date()
    const expectedReturnTime = new Date(
      startTime.getTime() + selectedHours * 60 * 60 * 1000
    )
    const confirmationCode = generateCode()
    const lockerAssigned = assignLocker(deviceType)
    const balanceBefore = student.walletBalance
    const paymentReference = `RENT-${uuidv4()
      .slice(0, 12).toUpperCase()}`

    // Deduct wallet
    student.walletBalance -= totalCost
    await student.save({
      validateBeforeSave: false,
      session
    })

    // Create rental
    const rental = await Rental.create(
      [{
        userId,
        deviceId: device._id,
        stationId,
        deviceType,
        rentalAmount: device.rentalPrice,
        depositAmount: device.depositAmount,
        totalPaid: totalCost,
        selectedHours,
        startTime,
        expectedReturnTime,
        confirmationCode,
        lockerAssigned,
        lockerStatus: 'unlocked',
        status: 'active',
        paymentReference
      }],
      { session }
    )

    // Update device atomically
    await Device.findByIdAndUpdate(
      device._id,
      {
        status: 'rented',
        currentRentalId: rental[0]._id,
        $inc: { totalRentals: 1 }
      },
      { session }
    )

    // Record transaction
    await Transaction.create(
      [{
        userId,
        rentalId: rental[0]._id,
        amount: totalCost,
        type: 'rental_payment',
        status: 'success',
        reference: paymentReference,
        provider: 'wallet',
        description: `${deviceType} rental for ${selectedHours} hour(s)`,
        balanceBefore,
        balanceAfter: student.walletBalance,
        metadata: {
          paymentType: 'wallet',
          deviceType,
          stationId,
          lockerAssigned
        }
      }],
      { session }
    )

    await session.commitTransaction()

    // Wallet was deducted, a new transaction exists, and station inventory changed
    cache.invalidate(`wallet:${userId}`)
    cache.invalidate(`txns:${userId}:1`)
    cache.invalidate(`station:${stationId}`)

    // Post-commit operations
    await createAuditLog({
      userId,
      role: 'student',
      action: 'RENTAL_STARTED',
      resourceType: 'Rental',
      resourceId: rental[0]._id,
      previousState: { walletBalance: balanceBefore },
      newState: { walletBalance: student.walletBalance },
      metadata: {
        deviceType, selectedHours,
        totalCost, lockerAssigned,
        confirmationCode,
        paymentType: 'wallet',
        stationName: station.name,
        stationLocation: station.location
      },
      ipAddress: req.ip,
      status: 'success'
    })

    await Notification.create({
      userId,
      title: '⚡ Rental Started',
      message: `Your ${deviceType} rental has started. Return by ${expectedReturnTime.toLocaleString()}.`,
      type: 'rental_started',
      rentalId: rental[0]._id
    })

    cache.invalidate(`notifs:${userId}`)

    await sendRentalStartedEmail(
      student.email,
      student.name,
      rental[0],
      deviceType
    )

    res.status(201).json({
      success: true,
      message: 'Rental started successfully',
      rental: {
        _id: rental[0]._id,
        deviceType,
        rentalAmount: device.rentalPrice,
        depositAmount: device.depositAmount,
        totalPaid: totalCost,
        selectedHours,
        startTime,
        expectedReturnTime,
        confirmationCode,
        lockerAssigned,
        lockerStatus: 'unlocked',
        status: 'active',
        paymentType: 'wallet'
      },
      locker: {
        assigned: lockerAssigned,
        status: 'UNLOCKED ✅',
        message: `Locker ${lockerAssigned} is now open. Please collect your ${deviceType}.`
      },
      walletBalance: student.walletBalance
    })

  } catch (error) {
    await session.abortTransaction()

    await createAuditLog({
      userId,
      role: 'student',
      action: 'RENTAL_STARTED',
      metadata: { deviceType, selectedHours, totalCost },
      status: 'failed',
      errorMessage: error.message
    })

    throw error
  } finally {
    session.endSession()
  }
}

// ─────────────────────────────────────────────────
// GET MY RENTALS
// GET /api/v1/rentals
// ─────────────────────────────────────────────────
const getMyRentals = async (req, res) => {
  const {
    status,
    page = 1,
    limit = 20
  } = req.query

  const filter = { userId: req.user._id }
  if (status) filter.status = status

  const rentals = await Rental.find(filter)
    .populate('deviceId', 'deviceType deviceCode rentalPrice depositAmount')
    .populate('stationId', 'name campus location')
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(Number(limit))
    .lean()

  const total = await Rental.countDocuments(filter)

  // Auto flag overdue rentals — mutating the plain object here is fine
  // since it's response-only and was never persisted even before .lean()
  const now = new Date()
  const updated = rentals.map(r => {
    if (r.status === 'active' && now > r.expectedReturnTime) {
      r.status = 'overdue'
    }
    return r
  })

  res.status(200).json({
    success: true,
    count: updated.length,
    total,
    page: Number(page),
    rentals: updated
  })
}

// ─────────────────────────────────────────────────
// GET SINGLE RENTAL
// GET /api/v1/rentals/:id
// ─────────────────────────────────────────────────
const getRental = async (req, res) => {
  const rental = await Rental.findById(req.params.id)
    .populate('deviceId', 'deviceType deviceCode rentalPrice depositAmount maxHours')
    .populate('stationId', 'name campus location')
    .populate('userId', 'name email phone')
    .populate('operatorId', 'name phone')

  if (!rental) {
    return res.status(404).json({
      success: false,
      message: 'Rental not found'
    })
  }

  // Check and update overdue status
  if (
    rental.status === 'active' &&
    new Date() > rental.expectedReturnTime
  ) {
    rental.status = 'overdue'
    await rental.save()

    await createAuditLog({
      userId: rental.userId._id || rental.userId,
      role: 'system',
      action: 'RENTAL_OVERDUE',
      resourceType: 'Rental',
      resourceId: rental._id,
      metadata: {
        expectedReturnTime: rental.expectedReturnTime,
        hoursOverdue: Math.ceil(
          (new Date() - rental.expectedReturnTime) /
          (1000 * 60 * 60)
        )
      },
      status: 'warning'
    })
  }

  res.status(200).json({ success: true, rental })
}

// ─────────────────────────────────────────────────
// INITIATE RETURN
// Student clicks return button
// POST /api/v1/rentals/:id/initiate-return
// ─────────────────────────────────────────────────
const initiateReturn = async (req, res) => {
  const rental = await Rental.findOne({
    _id: req.params.id,
    userId: req.user._id,
    status: { $in: ['active', 'overdue'] }
  }).populate('stationId', 'name location')

  if (!rental) {
    return res.status(404).json({
      success: false,
      message: 'No active rental found with this ID'
    })
  }

  // Check if overdue and calculate potential late fee
  const now = new Date()
  let lateFeeWarning = null

  if (now > rental.expectedReturnTime) {
    const hoursLate = Math.ceil(
      (now - rental.expectedReturnTime) /
      (1000 * 60 * 60)
    )
    const estimatedLateFee = hoursLate <= 2 ? 100 : 200
    const estimatedRefund =
      rental.depositAmount - estimatedLateFee

    lateFeeWarning = {
      isLate: true,
      hoursLate,
      estimatedLateFee,
      estimatedRefund
    }
  }

  await createAuditLog({
    userId: req.user._id,
    role: 'student',
    action: 'RENTAL_RETURN_INITIATED',
    resourceType: 'Rental',
    resourceId: rental._id,
    metadata: {
      deviceType: rental.deviceType,
      confirmationCode: rental.confirmationCode,
      isLate: !!lateFeeWarning
    },
    ipAddress: req.ip,
    status: 'success'
  })

  res.status(200).json({
    success: true,
    message: 'Return initiated. Hand device to operator then enter your confirmation code.',
    rentalId: rental._id,
    confirmationCode: rental.confirmationCode,
    deviceType: rental.deviceType,
    station: {
      name: rental.stationId?.name,
      location: rental.stationId?.location
    },
    lateFeeWarning,
    instructions: [
      '1. Go to the Waka Charge kiosk station',
      '2. Hand your device to the operator',
      '3. Operator will confirm receipt on their dashboard',
      `4. Enter your code: ${rental.confirmationCode}`,
      '5. Your deposit will be refunded instantly'
    ]
  })
}

// ─────────────────────────────────────────────────
// CONFIRM RETURN
// Student enters 4-digit code
// PATCH /api/v1/rentals/:id/confirm-return
// ─────────────────────────────────────────────────
const confirmReturn = async (req, res) => {
  const { confirmationCode } = req.body

  if (!confirmationCode) {
    return res.status(400).json({
      success: false,
      message: 'Please provide your confirmation code'
    })
  }

  const rental = await Rental.findOne({
    _id: req.params.id,
    userId: req.user._id,
    status: { $in: ['active', 'overdue'] }
  })

  if (!rental) {
    return res.status(404).json({
      success: false,
      message: 'No active rental found'
    })
  }

  // Must have operator confirmation first
  if (!rental.operatorConfirmed) {
    return res.status(400).json({
      success: false,
      message: 'Operator has not confirmed receipt yet. Please hand device to operator first.',
      step: 'AWAITING_OPERATOR_CONFIRMATION'
    })
  }

  // Validate code
  if (rental.confirmationCode !== confirmationCode.trim()) {
    await createAuditLog({
      userId: req.user._id,
      role: 'student',
      action: 'RENTAL_RETURNED',
      resourceType: 'Rental',
      resourceId: rental._id,
      metadata: {
        reason: 'Invalid confirmation code',
        attempt: confirmationCode
      },
      status: 'failed',
      errorMessage: 'Invalid confirmation code entered'
    })

    return res.status(400).json({
      success: false,
      message: 'Invalid confirmation code. Please check and try again.'
    })
  }

  // Calculate late fee
  const actualReturnTime = new Date()
  let lateFee = 0

  if (actualReturnTime > rental.expectedReturnTime) {
    const hoursLate = Math.ceil(
      (actualReturnTime - rental.expectedReturnTime) /
      (1000 * 60 * 60)
    )
    lateFee = hoursLate <= 2 ? 100 : 200
  }

  const depositRefunded = rental.depositAmount - lateFee
  const isEarlyReturn = actualReturnTime < rental.expectedReturnTime

  const session = await mongoose.startSession()
  session.startTransaction()

  try {
    const student = await User.findById(req.user._id)
      .session(session)
    const balanceBefore = student.walletBalance

    // Refund deposit to wallet
    student.walletBalance += depositRefunded
    await student.save({
      validateBeforeSave: false,
      session
    })

    // Update rental
    rental.status = 'returned'
    rental.actualReturnTime = actualReturnTime
    rental.lateFee = lateFee
    rental.depositRefunded = depositRefunded
    rental.lockerStatus = 'locked'
    await rental.save({ session })

    // Free up device
    await Device.findByIdAndUpdate(
      rental.deviceId,
      {
        status: 'available',
        currentRentalId: null
      },
      { session }
    )

    // Record refund transaction
    const refundRef = `REFUND-${uuidv4()
      .slice(0, 12).toUpperCase()}`

    await Transaction.create(
      [{
        userId: req.user._id,
        rentalId: rental._id,
        amount: depositRefunded,
        type: 'deposit_refund',
        status: 'success',
        reference: refundRef,
        provider: 'wallet',
        description: `Deposit refund — ${rental.deviceType}${
          lateFee > 0
            ? ` (₦${lateFee} late fee deducted)`
            : ''
        }`,
        balanceBefore,
        balanceAfter: student.walletBalance,
        metadata: {
          rentalId: rental._id,
          lateFee,
          depositAmount: rental.depositAmount,
          isEarlyReturn,
          hoursUsed: Math.ceil(
            (actualReturnTime - rental.startTime) /
            (1000 * 60 * 60)
          )
        }
      }],
      { session }
    )

    // Record late fee transaction if applicable
    if (lateFee > 0) {
      await Transaction.create(
        [{
          userId: req.user._id,
          rentalId: rental._id,
          amount: lateFee,
          type: 'late_fee',
          status: 'success',
          reference: `LATEFEE-${uuidv4()
            .slice(0, 12).toUpperCase()}`,
          provider: 'wallet',
          description: `Late return fee — ${rental.deviceType}`,
          balanceBefore: balanceBefore + depositRefunded,
          balanceAfter: student.walletBalance,
          metadata: { rentalId: rental._id }
        }],
        { session }
      )
    }

    await session.commitTransaction()

    // Wallet credited (refund), new transaction(s) exist, station inventory changed
    cache.invalidate(`wallet:${req.user._id}`)
    cache.invalidate(`txns:${req.user._id}:1`)
    cache.invalidate(`station:${rental.stationId}`)

    // Update trust score
    let trustUpdate
    try {
      if (lateFee > 0) {
        trustUpdate = await penaliseLateReturn(req.user._id)
      } else {
        trustUpdate = await rewardSuccessfulReturn(
          req.user._id, isEarlyReturn
        )
      }
    } catch (trustError) {
      console.error(
        '❌ Trust score update failed:',
        trustError.message
      )
    }

    // Audit log
    await createAuditLog({
      userId: req.user._id,
      role: 'student',
      action: 'RENTAL_RETURNED',
      resourceType: 'Rental',
      resourceId: rental._id,
      previousState: {
        status: 'active',
        walletBalance: balanceBefore
      },
      newState: {
        status: 'returned',
        walletBalance: student.walletBalance
      },
      metadata: {
        deviceType: rental.deviceType,
        lateFee,
        depositRefunded,
        isEarlyReturn,
        actualReturnTime,
        trustScoreChange: trustUpdate
          ? (lateFee > 0 ? -1 : isEarlyReturn ? +2 : +1)
          : null
      },
      ipAddress: req.ip,
      status: 'success'
    })

    // Late fee audit
    if (lateFee > 0) {
      await createAuditLog({
        userId: req.user._id,
        role: 'student',
        action: 'LATE_FEE_CHARGED',
        resourceType: 'Rental',
        resourceId: rental._id,
        metadata: {
          lateFee,
          deviceType: rental.deviceType
        },
        status: 'success'
      })
    }

    // Notifications
    await Notification.create({
      userId: req.user._id,
      title: '💰 Deposit Refunded',
      message: `₦${depositRefunded.toLocaleString()} refunded to your wallet.${
        lateFee > 0
          ? ` ₦${lateFee} late fee was deducted.`
          : isEarlyReturn
          ? ' +2 trust points for early return!'
          : ' +1 trust point earned!'
      }${
        trustUpdate?.rnplEnabled &&
        !req.user.rnplEnabled
          ? ' 🎉 RNPL unlocked!'
          : ''
      }`,
      type: 'deposit_refunded',
      rentalId: rental._id
    })

    cache.invalidate(`notifs:${req.user._id}`)

    await sendDepositRefundedEmail(
      student.email,
      student.name,
      depositRefunded,
      student.walletBalance
    )

    res.status(200).json({
      success: true,
      message: 'Device returned successfully. Deposit refunded!',
      rental: {
        _id: rental._id,
        deviceType: rental.deviceType,
        status: 'returned',
        startTime: rental.startTime,
        expectedReturnTime: rental.expectedReturnTime,
        actualReturnTime,
        selectedHours: rental.selectedHours,
        rentalAmount: rental.rentalAmount,
        depositAmount: rental.depositAmount,
        lateFee,
        depositRefunded,
        isEarlyReturn
      },
      walletBalance: student.walletBalance,
      trustScore: trustUpdate || null
    })

  } catch (error) {
    await session.abortTransaction()

    await createAuditLog({
      userId: req.user._id,
      role: 'student',
      action: 'RENTAL_RETURNED',
      resourceType: 'Rental',
      resourceId: rental._id,
      metadata: { step: 'confirm_return' },
      status: 'failed',
      errorMessage: error.message
    })

    throw error
  } finally {
    session.endSession()
  }
}

// ─────────────────────────────────────────────────
// CANCEL RENTAL
// Within 5 minutes only — full refund
// PATCH /api/v1/rentals/:id/cancel
// ─────────────────────────────────────────────────
const cancelRental = async (req, res) => {
  const rental = await Rental.findOne({
    _id: req.params.id,
    userId: req.user._id,
    status: 'active'
  })

  if (!rental) {
    return res.status(404).json({
      success: false,
      message: 'No active rental found with this ID'
    })
  }

  // Only allow cancel within 5 minutes of starting
  const minutesSinceStart =
    (new Date() - rental.startTime) / (1000 * 60)

  if (minutesSinceStart > 5) {
    return res.status(400).json({
      success: false,
      message: `Cancellation window has closed. You can only cancel within 5 minutes of starting. Please return the device normally.`,
      minutesSinceStart: Math.ceil(minutesSinceStart),
      cancellationWindow: '5 minutes'
    })
  }

  const session = await mongoose.startSession()
  session.startTransaction()

  try {
    const student = await User.findById(req.user._id)
      .session(session)
    const balanceBefore = student.walletBalance

    // Full refund
    student.walletBalance += rental.totalPaid
    await student.save({
      validateBeforeSave: false,
      session
    })

    // Update rental
    rental.status = 'cancelled'
    rental.actualReturnTime = new Date()
    await rental.save({ session })

    // Free device
    await Device.findByIdAndUpdate(
      rental.deviceId,
      {
        status: 'available',
        currentRentalId: null
      },
      { session }
    )

    // Record refund transaction
    await Transaction.create(
      [{
        userId: req.user._id,
        rentalId: rental._id,
        amount: rental.totalPaid,
        type: 'deposit_refund',
        status: 'success',
        reference: `CANCEL-${uuidv4()
          .slice(0, 12).toUpperCase()}`,
        provider: 'wallet',
        description: `Rental cancellation refund — ${rental.deviceType}`,
        balanceBefore,
        balanceAfter: student.walletBalance,
        metadata: {
          rentalId: rental._id,
          cancellationReason: 'Student cancelled within 5 minutes',
          minutesSinceStart: Math.ceil(minutesSinceStart)
        }
      }],
      { session }
    )

    await session.commitTransaction()

    // Wallet credited (full refund), new transaction exists, station inventory changed
    cache.invalidate(`wallet:${req.user._id}`)
    cache.invalidate(`txns:${req.user._id}:1`)
    cache.invalidate(`station:${rental.stationId}`)

    await createAuditLog({
      userId: req.user._id,
      role: 'student',
      action: 'RENTAL_CANCELLED',
      resourceType: 'Rental',
      resourceId: rental._id,
      previousState: {
        status: 'active',
        walletBalance: balanceBefore
      },
      newState: {
        status: 'cancelled',
        walletBalance: student.walletBalance
      },
      metadata: {
        deviceType: rental.deviceType,
        totalPaid: rental.totalPaid,
        minutesSinceStart: Math.ceil(minutesSinceStart)
      },
      ipAddress: req.ip,
      status: 'success'
    })

    await Notification.create({
      userId: req.user._id,
      title: '❌ Rental Cancelled',
      message: `Your ${rental.deviceType} rental was cancelled. ₦${rental.totalPaid.toLocaleString()} refunded to your wallet.`,
      type: 'general',
      rentalId: rental._id
    })

    cache.invalidate(`notifs:${req.user._id}`)

    res.status(200).json({
      success: true,
      message: `Rental cancelled. Full refund of ₦${rental.totalPaid.toLocaleString()} returned to your wallet.`,
      rental: {
        _id: rental._id,
        deviceType: rental.deviceType,
        status: 'cancelled',
        refundAmount: rental.totalPaid
      },
      walletBalance: student.walletBalance
    })

  } catch (error) {
    await session.abortTransaction()

    await createAuditLog({
      userId: req.user._id,
      role: 'student',
      action: 'RENTAL_CANCELLED',
      resourceType: 'Rental',
      resourceId: rental._id,
      metadata: { step: 'cancel_rental' },
      status: 'failed',
      errorMessage: error.message
    })

    throw error
  } finally {
    session.endSession()
  }
}

// ─────────────────────────────────────────────────
// Exports
// ─────────────────────────────────────────────────
module.exports = {
  startRental,
  getMyRentals,
  getRental,
  initiateReturn,
  confirmReturn,
  cancelRental
}