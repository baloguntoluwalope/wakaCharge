const Station = require('../models/Station')
const Device = require('../models/Device')
const {
  generateStationQR,
  generateStationQRString
} = require('../services/qr.service')
const { cache } = require('../services/cache.service')

const getStations = async (req, res) => {
  const filter = { isActive: true }
  if (req.user.role === 'student') {
    filter.campus = req.user.campus
  } else if (req.query.campus) {
    filter.campus = req.query.campus
  }

  const stations = await Station.find(filter)
    .populate('operatorId', 'name phone')
    .lean()

  res.status(200).json({
    success: true,
    count: stations.length,
    stations
  })
}

const getStation = async (req, res) => {
  const station = await Station.findById(req.params.id)
    .populate('operatorId', 'name phone')
    .lean()

  if (!station) {
    return res.status(404).json({
      success: false,
      message: 'Station not found'
    })
  }

  const devices = await Device.find({ stationId: station._id })
    .select('deviceType status')
    .lean()

  const inventory = {
    powerbank:   { total: 0, available: 0 },
    studylamp:   { total: 0, available: 0 },
    survivalkit: { total: 0, available: 0 },
    comfortkit:  { total: 0, available: 0 }
  }
  devices.forEach(d => {
    if (inventory[d.deviceType]) {
      inventory[d.deviceType].total++
      if (d.status === 'available') {
        inventory[d.deviceType].available++
      }
    }
  })

  res.status(200).json({ success: true, station, inventory })
}

const scanQR = async (req, res) => {
  const { stationId } = req.body
  const station = await Station.findById(stationId).lean()
  if (!station || !station.isActive) {
    return res.status(404).json({
      success: false,
      message: 'Station not found'
    })
  }
  const devices = await Device.find({
    stationId: station._id,
    status: 'available'
  }).lean()

  res.status(200).json({
    success: true,
    message: 'Station found',
    station: {
      _id: station._id,
      name: station.name,
      campus: station.campus,
      location: station.location
    },
    availableDevices: devices.length,
    devices
  })
}

const createStation = async (req, res) => {
  const {
    name, campus, location,
    description, operatorId, coordinates
  } = req.body

  // NOT using .lean() here — we mutate and .save() this document below
  const station = await Station.create({
    name, campus, location,
    description, operatorId, coordinates
  })

  const qrCode = await generateStationQR(station._id)
  station.qrCode = qrCode
  station.qrCodeUrl = generateStationQRString(station._id)
  await station.save()

  // New station created — any cached "all stations" list for this campus is now stale
  cache.invalidate('stations:')

  res.status(201).json({
    success: true,
    message: 'Station created',
    station
  })
}

const updateStation = async (req, res) => {
  const station = await Station.findByIdAndUpdate(
    req.params.id, req.body,
    { new: true, runValidators: true }
  ).lean()

  if (!station) {
    return res.status(404).json({
      success: false,
      message: 'Station not found'
    })
  }

  cache.invalidate(`station:${req.params.id}`)
  cache.invalidate('stations:') // clears every cached campus list, since one station changing can affect any list that shows it

  res.status(200).json({
    success: true,
    message: 'Station updated',
    station
  })
}

const deleteStation = async (req, res) => {
  const station = await Station.findByIdAndUpdate(
    req.params.id,
    { isActive: false },
    { new: true }
  ).select('_id').lean()

  if (!station) {
    return res.status(404).json({
      success: false,
      message: 'Station not found'
    })
  }

  cache.invalidate(`station:${req.params.id}`)
  cache.invalidate('stations:') // deactivated station should disappear from all cached lists

  res.status(200).json({
    success: true,
    message: 'Station deactivated'
  })
}

module.exports = {
  getStations,
  getStation,
  scanQR,
  createStation,
  updateStation,
  deleteStation
}