const Device = require('../models/Device')
const { v4: uuidv4 } = require('uuid')

const DEVICE_CONFIG = {
  powerbank:   { rentalPrice: 300, depositAmount: 500, maxHours: 8 },
  studylamp:   { rentalPrice: 300, depositAmount: 500, maxHours: 12 },
  survivalkit: { rentalPrice: 500, depositAmount: 700, maxHours: 12 },
  comfortkit:  { rentalPrice: 700, depositAmount: 1000, maxHours: 12 }
}

const getDevices = async (req, res) => {
  const { stationId, status, deviceType } = req.query
  const filter = {}
  if (stationId) filter.stationId = stationId
  if (status) filter.status = status
  if (deviceType) filter.deviceType = deviceType

  const devices = await Device.find(filter)
    .populate('stationId', 'name campus location')
  res.status(200).json({
    success: true,
    count: devices.length,
    devices
  })
}

const getDevice = async (req, res) => {
  const device = await Device.findById(req.params.id)
    .populate('stationId', 'name campus location')
  if (!device) {
    return res.status(404).json({
      success: false,
      message: 'Device not found'
    })
  }
  res.status(200).json({ success: true, device })
}

const getDevicesByStation = async (req, res) => {
  const devices = await Device.find({
    stationId: req.params.stationId
  })
  const grouped = {
    powerbank:   devices.filter(d => d.deviceType === 'powerbank'),
    studylamp:   devices.filter(d => d.deviceType === 'studylamp'),
    survivalkit: devices.filter(d => d.deviceType === 'survivalkit'),
    comfortkit:  devices.filter(d => d.deviceType === 'comfortkit')
  }
  res.status(200).json({
    success: true,
    count: devices.length,
    devices,
    grouped
  })
}

const createDevice = async (req, res) => {
  const { stationId, deviceType, quantity = 1 } = req.body

  if (!DEVICE_CONFIG[deviceType]) {
    return res.status(400).json({
      success: false,
      message: 'Invalid device type'
    })
  }

  const config = DEVICE_CONFIG[deviceType]
  const created = []

  for (let i = 0; i < quantity; i++) {
    const device = await Device.create({
      stationId,
      deviceType,
      deviceCode: `${deviceType.toUpperCase()}-${uuidv4()
        .slice(0, 8).toUpperCase()}`,
      ...config
    })
    created.push(device)
  }

  res.status(201).json({
    success: true,
    message: `${quantity} ${deviceType}(s) created`,
    devices: created
  })
}

const updateDevice = async (req, res) => {
  const device = await Device.findByIdAndUpdate(
    req.params.id, req.body, { new: true }
  )
  if (!device) {
    return res.status(404).json({
      success: false,
      message: 'Device not found'
    })
  }
  res.status(200).json({
    success: true,
    message: 'Device updated',
    device
  })
}

const deleteDevice = async (req, res) => {
  const device = await Device.findByIdAndDelete(req.params.id)
  if (!device) {
    return res.status(404).json({
      success: false,
      message: 'Device not found'
    })
  }
  res.status(200).json({
    success: true,
    message: 'Device deleted'
  })
}

const reportDamaged = async (req, res) => {
  const { notes } = req.body
  const device = await Device.findByIdAndUpdate(
    req.params.id,
    { status: 'damaged', notes },
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

module.exports = {
  getDevices,
  getDevice,
  getDevicesByStation,
  createDevice,
  updateDevice,
  deleteDevice,
  reportDamaged,
  DEVICE_CONFIG
}