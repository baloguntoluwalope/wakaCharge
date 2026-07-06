const express = require('express')
const router = express.Router()
const {
  getStations, getStation, scanQR,
  createStation, updateStation, deleteStation
} = require('../controllers/station.controller')
const {
  protect, authorize
} = require('../middleware/auth.middleware')
const { cacheMiddleware } = require('../services/cache.service')

/**
 * @swagger
 * tags:
 *   name: Stations
 *   description: Waka Charge kiosk stations
 */

/**
 * @swagger
 * /api/v1/stations:
 *   get:
 *     summary: Get stations (students see campus only)
 *     tags: [Stations]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of stations
 */
router.get(
  '/',
  protect,
  cacheMiddleware(300, (req) => `stations:${req.user.campus || req.query.campus || 'all'}`),
  getStations
)

/**
 * @swagger
 * /api/v1/stations/scan:
 *   post:
 *     summary: Scan station QR code
 *     tags: [Stations]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [stationId]
 *             properties:
 *               stationId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Station found with available devices
 */
router.post('/scan', protect, scanQR)

/**
 * @swagger
 * /api/v1/stations/{id}:
 *   get:
 *     summary: Get station with full inventory
 *     tags: [Stations]
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
 *         description: Station details and inventory
 */
router.get(
  '/:id',
  protect,
  cacheMiddleware(120, (req) => `station:${req.params.id}`),
  getStation
)

/**
 * @swagger
 * /api/v1/stations:
 *   post:
 *     summary: Create station (Admin only)
 *     tags: [Stations]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, campus, location]
 *             properties:
 *               name:
 *                 type: string
 *                 example: Station A
 *               campus:
 *                 type: string
 *                 example: LASU
 *               location:
 *                 type: string
 *                 example: Library Block
 *     responses:
 *       201:
 *         description: Station created with QR code
 */
router.post('/', protect, authorize('admin'), createStation)

/**
 * @swagger
 * /api/v1/stations/{id}:
 *   put:
 *     summary: Update station (Admin only)
 *     tags: [Stations]
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
 *         description: Station updated
 */
router.put('/:id', protect, authorize('admin'), updateStation)

/**
 * @swagger
 * /api/v1/stations/{id}:
 *   delete:
 *     summary: Deactivate station (Admin only)
 *     tags: [Stations]
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
 *         description: Station deactivated
 */
router.delete('/:id', protect, authorize('admin'), deleteStation)

module.exports = router