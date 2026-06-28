const express = require('express')
const router = express.Router()
const {
  getDevices, getDevice, getDevicesByStation,
  createDevice, updateDevice,
  deleteDevice, reportDamaged
} = require('../controllers/device.controller')
const {
  protect, authorize
} = require('../middleware/auth.middleware')

/**
 * @swagger
 * tags:
 *   name: Devices
 *   description: Power banks, study lamps, survival kits, comfort kits
 */

/**
 * @swagger
 * /api/v1/devices:
 *   get:
 *     summary: Get all devices
 *     tags: [Devices]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: stationId
 *         schema:
 *           type: string
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [available, rented, damaged, charging]
 *       - in: query
 *         name: deviceType
 *         schema:
 *           type: string
 *           enum: [powerbank, studylamp, survivalkit, comfortkit]
 *     responses:
 *       200:
 *         description: List of devices
 */
router.get('/', protect, getDevices)

/**
 * @swagger
 * /api/v1/devices/station/{stationId}:
 *   get:
 *     summary: Get devices grouped by type at a station
 *     tags: [Devices]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: stationId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Devices grouped by type
 */
router.get('/station/:stationId', protect, getDevicesByStation)

/**
 * @swagger
 * /api/v1/devices/{id}:
 *   get:
 *     summary: Get single device
 *     tags: [Devices]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Device details
 */
router.get('/:id', protect, getDevice)

/**
 * @swagger
 * /api/v1/devices:
 *   post:
 *     summary: Add devices to station (Admin only)
 *     tags: [Devices]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [stationId, deviceType]
 *             properties:
 *               stationId:
 *                 type: string
 *               deviceType:
 *                 type: string
 *                 enum: [powerbank, studylamp, survivalkit, comfortkit]
 *               quantity:
 *                 type: number
 *                 example: 5
 *     responses:
 *       201:
 *         description: Devices created
 */
router.post('/', protect, authorize('admin'), createDevice)

/**
 * @swagger
 * /api/v1/devices/{id}/damage:
 *   patch:
 *     summary: Report device damaged (Operator only)
 *     tags: [Devices]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               notes:
 *                 type: string
 *                 example: Screen cracked
 *     responses:
 *       200:
 *         description: Device reported as damaged
 */
router.patch(
  '/:id/damage',
  protect,
  authorize('operator', 'admin'),
  reportDamaged
)

/**
 * @swagger
 * /api/v1/devices/{id}:
 *   put:
 *     summary: Update device (Admin only)
 *     tags: [Devices]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Device updated
 */
router.put('/:id', protect, authorize('admin'), updateDevice)

/**
 * @swagger
 * /api/v1/devices/{id}:
 *   delete:
 *     summary: Delete device (Admin only)
 *     tags: [Devices]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Device deleted
 */
router.delete('/:id', protect, authorize('admin'), deleteDevice)

module.exports = router