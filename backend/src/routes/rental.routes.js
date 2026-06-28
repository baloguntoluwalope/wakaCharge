const express = require('express')
const router = express.Router()
const {
  startRental, getMyRentals, getRental,
  initiateReturn, confirmReturn, cancelRental
} = require('../controllers/rental.controller')
const {
  protect, authorize
} = require('../middleware/auth.middleware')

/**
 * @swagger
 * tags:
 *   name: Rentals
 *   description: Device rental — start, return, cancel
 */

/**
 * @swagger
 * /api/v1/rentals:
 *   post:
 *     summary: Start a rental
 *     tags: [Rentals]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [stationId, deviceType, selectedHours]
 *             properties:
 *               stationId:
 *                 type: string
 *               deviceType:
 *                 type: string
 *                 enum: [powerbank, studylamp, survivalkit, comfortkit]
 *               selectedHours:
 *                 type: number
 *                 example: 4
 *     responses:
 *       201:
 *         description: Rental started. Locker unlocked.
 *       400:
 *         description: Insufficient wallet balance
 */
router.post('/', protect, authorize('student'), startRental)

/**
 * @swagger
 * /api/v1/rentals:
 *   get:
 *     summary: Get my rental history
 *     tags: [Rentals]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [active, returned, overdue, cancelled]
 *     responses:
 *       200:
 *         description: List of rentals
 */
router.get('/', protect, getMyRentals)

/**
 * @swagger
 * /api/v1/rentals/{id}:
 *   get:
 *     summary: Get single rental
 *     tags: [Rentals]
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
 *         description: Rental details
 */
router.get('/:id', protect, getRental)

/**
 * @swagger
 * /api/v1/rentals/{id}/initiate-return:
 *   post:
 *     summary: Initiate return — get confirmation code
 *     tags: [Rentals]
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
 *         description: Returns 4-digit code. Hand device to operator then enter code.
 */
router.post(
  '/:id/initiate-return',
  protect,
  authorize('student'),
  initiateReturn
)

/**
 * @swagger
 * /api/v1/rentals/{id}/confirm-return:
 *   patch:
 *     summary: Confirm return with 4-digit code
 *     tags: [Rentals]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [confirmationCode]
 *             properties:
 *               confirmationCode:
 *                 type: string
 *                 example: "4821"
 *     responses:
 *       200:
 *         description: Return confirmed. Deposit refunded instantly.
 *       400:
 *         description: Invalid code or operator not confirmed yet
 */
router.patch(
  '/:id/confirm-return',
  protect,
  authorize('student'),
  confirmReturn
)

/**
 * @swagger
 * /api/v1/rentals/{id}/cancel:
 *   patch:
 *     summary: Cancel rental within 5 minutes
 *     tags: [Rentals]
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
 *         description: Cancelled. Full refund to wallet.
 */
router.patch(
  '/:id/cancel',
  protect,
  authorize('student'),
  cancelRental
)

module.exports = router