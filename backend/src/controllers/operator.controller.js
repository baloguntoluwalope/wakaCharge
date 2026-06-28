const Rental = require('../models/Rental')
const Device = require('../models/Device')
const Station = require('../models/Station')
const User = require('../models/User')
const Notification = require('../models/Notification')

const getOperatorDashboard = async (req, res) => {
  const operator = await User.findById(req.user._id)
  const stationId = operator.stationId

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const [activeRentals, returnedToday, devices, station] =
    await Promise.all([
      Rental.find({
        stationId,
        status: { $in: ['active', 'overdue'] }
      })
        .populate('userId', 'name phone email')
        .populate('deviceId', 'deviceType deviceCode'),
      Rental.find({
        stationId, status: 'returned',
        actualReturnTime: { $gte: today }
      }),
      Device.find({ stationId }),
      Station.findById(stationId)
    ])

  const inventory = {
    powerbank:   { total: 0, available: 0, rented: 0, damaged: 0 },
    studylamp:   { total: 0, available: 0, rented: 0, damaged: 0 },
    survivalkit: { total: 0, available: 0, rented: 0, damaged: 0 },
    comfortkit:  { total: 0, available: 0, rented: 0, damaged: 0 }
  }

  devices.forEach(d => {
    if (inventory[d.deviceType]) {
      inventory[d.deviceType].total++
      if (d.status === 'available') inventory[d.deviceType].available++
      else if (d.status === 'rented') inventory[d.deviceType].rented++
      else if (d.status === 'damaged') inventory[d.deviceType].damaged++
    }
  })

  const lowInventory = Object.entries(inventory)
    .filter(([, v]) => v.available === 0 && v.total > 0)
    .map(([type]) => type)

  res.status(200).json({
    success: true, station,
    summary: {
      activeRentals: activeRentals.length,
      returnedToday: returnedToday.length,
      totalDevices: devices.length,
      availableDevices: devices.filter(d => d.status === 'available').length,
      overdueRentals: activeRentals.filter(r => r.status === 'overdue').length
    },
    inventory, lowInventory, activeRentals
  })
}

const getActiveRentals = async (req, res) => {
  const operator = await User.findById(req.user._id)
  const rentals = await Rental.find({
    stationId: operator.stationId,
    status: { $in: ['active', 'overdue'] }
  })
    .populate('userId', 'name phone email')
    .populate('deviceId', 'deviceType deviceCode')
    .sort({ createdAt: -1 })

  res.status(200).json({
    success: true,
    count: rentals.length,
    rentals
  })
}

const operatorConfirmReturn = async (req, res) => {
  const { rentalId } = req.body
  const rental = await Rental.findOne({
    _id: rentalId,
    status: { $in: ['active', 'overdue'] }
  }).populate('userId', 'name email phone')

  if (!rental) {
    return res.status(404).json({
      success: false,
      message: 'Active rental not found'
    })
  }

  rental.operatorConfirmed = true
  rental.operatorId = req.user._id
  await rental.save()

  await Notification.create({
    userId: rental.userId._id,
    title: '✅ Operator Confirmed',
    message: 'Operator confirmed receipt. Enter your code to complete return.',
    type: 'device_returned',
    rentalId: rental._id
  })

  res.status(200).json({
    success: true,
    message: 'Confirmed. Student can now enter their code.',
    rental: {
      _id: rental._id,
      student: rental.userId.name,
      deviceType: rental.deviceType,
      confirmationCode: rental.confirmationCode
    }
  })
}

const reportDeviceDamaged = async (req, res) => {
  const { deviceId, damageReport } = req.body
  const device = await Device.findByIdAndUpdate(
    deviceId,
    { status: 'damaged', notes: damageReport },
    { new: true }
  )
  if (!device) {
    return res.status(404).json({
      success: false,
      message: 'Device not found'
    })
  }
  res.status(200).json({
    success: true,
    message: 'Device reported as damaged',
    device
  })
}

const getInventory = async (req, res) => {
  const operator = await User.findById(req.user._id)
  const devices = await Device.find({
    stationId: operator.stationId
  })
  res.status(200).json({
    success: true,
    count: devices.length,
    devices
  })
}

const clockIn = async (req, res) => {
  const operator = await User.findById(req.user._id)
  const devices = await Device.find({
    stationId: operator.stationId
  })

  const inventorySnapshot = {
    powerbank: devices.filter(d =>
      d.deviceType === 'powerbank' && d.status === 'available'
    ).length,
    studylamp: devices.filter(d =>
      d.deviceType === 'studylamp' && d.status === 'available'
    ).length,
    survivalkit: devices.filter(d =>
      d.deviceType === 'survivalkit' && d.status === 'available'
    ).length,
    comfortkit: devices.filter(d =>
      d.deviceType === 'comfortkit' && d.status === 'available'
    ).length,
    clockInTime: new Date()
  }

  res.status(200).json({
    success: true,
    message: 'Clocked in successfully',
    inventorySnapshot,
    shift: {
      startTime: new Date(),
      operator: operator.name,
      stationId: operator.stationId
    }
  })
}

const clockOut = async (req, res) => {
  const { clockInTime } = req.body
  const operator = await User.findById(req.user._id)
  const devices = await Device.find({
    stationId: operator.stationId
  })

  const rentalsThisShift = await Rental.find({
    stationId: operator.stationId,
    createdAt: { $gte: new Date(clockInTime) }
  })

  const inventorySnapshot = {
    powerbank: devices.filter(d =>
      d.deviceType === 'powerbank' && d.status === 'available'
    ).length,
    studylamp: devices.filter(d =>
      d.deviceType === 'studylamp' && d.status === 'available'
    ).length,
    survivalkit: devices.filter(d =>
      d.deviceType === 'survivalkit' && d.status === 'available'
    ).length,
    comfortkit: devices.filter(d =>
      d.deviceType === 'comfortkit' && d.status === 'available'
    ).length,
    clockOutTime: new Date()
  }

  res.status(200).json({
    success: true,
    message: 'Clocked out. Inventory saved for next operator.',
    shiftSummary: {
      operator: operator.name,
      startTime: clockInTime,
      endTime: new Date(),
      rentalsHandled: rentalsThisShift.length,
      finalInventory: inventorySnapshot
    }
  })
}

const searchStudent = async (req, res) => {
  const { query } = req.query
  const students = await User.find({
    role: 'student',
    $or: [
      { name: { $regex: query, $options: 'i' } },
      { email: { $regex: query, $options: 'i' } },
      { phone: { $regex: query, $options: 'i' } }
    ]
  }).select('name email phone campus walletBalance')

  res.status(200).json({
    success: true,
    count: students.length,
    students
  })
}

module.exports = {
  getOperatorDashboard,
  getActiveRentals,
  operatorConfirmReturn,
  reportDeviceDamaged,
  getInventory,
  clockIn, clockOut,
  searchStudent
}