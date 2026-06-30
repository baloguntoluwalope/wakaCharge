const express = require('express')
const router = express.Router()
const {
  startRental,
  getMyRentals,
  getRental,
  initiateReturn,
  confirmReturn,
  cancelRental
} = require('../controllers/rental.controller')
const {
  protect,
  authorize
} = require('../middleware/auth.middleware')
const {
  validateStartRental
} = require('../middleware/validate.middleware')

/**
 * @swagger
 * tags:
 *   name: Rentals
 *   description: |
 *     Complete rental lifecycle management.
 *     Supports both wallet payment and RNPL (Rent Now Pay Later).
 *
 *     ### Normal Rental Flow
 *     1. POST /rentals — start rental (deducts from wallet)
 *     2. POST /rentals/:id/initiate-return — get confirmation code
 *     3. PATCH /rentals/:id/confirm-return — enter code + get deposit back
 *
 *     ### RNPL Rental Flow
 *     1. POST /rentals with useRNPL: true — rent without paying
 *     2. POST /rentals/:id/initiate-return — same as normal
 *     3. PATCH /rentals/:id/confirm-return — same as normal
 *     4. POST /trust/pay-rnpl — pay outstanding balance later
 *
 *     ### Return Security
 *     Two-step verification prevents fake returns:
 *     - Step 1: Operator physically confirms device received
 *     - Step 2: Student enters 4-digit confirmation code
 *     - Both must complete before deposit is refunded
 */

// ─────────────────────────────────────────────────
// START RENTAL
// ─────────────────────────────────────────────────

/**
 * @swagger
 * /api/v1/rentals:
 *   post:
 *     summary: Start a new rental — wallet or RNPL payment
 *     tags: [Rentals]
 *     security:
 *       - bearerAuth: []
 *     description: |
 *       Starts a device rental. Supports two payment methods:
 *
 *       **Wallet Payment (default):**
 *       - Deducts rental fee + deposit from wallet instantly
 *       - Available to all students with sufficient balance
 *
 *       **RNPL — Rent Now Pay Later:**
 *       - No upfront payment required
 *       - Only available after 10+ successful rentals
 *       - Must pay within 48 hours
 *       - Outstanding debt blocks new RNPL rentals
 *
 *       On success:
 *       - Smart locker slot is unlocked (simulated)
 *       - 4-digit confirmation code is generated
 *       - Rental timer starts
 *       - Email notification sent
 *       - Audit log created
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
 *                 example: 664f1b2c3d4e5f6a7b8c9d0e
 *                 description: MongoDB ID of the station
 *               deviceType:
 *                 type: string
 *                 enum: [powerbank, studylamp, survivalkit, comfortkit]
 *                 example: powerbank
 *               selectedHours:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 12
 *                 example: 4
 *                 description: |
 *                   Power bank max 8 hours.
 *                   Study lamp, survival kit, comfort kit max 12 hours.
 *               useRNPL:
 *                 type: boolean
 *                 default: false
 *                 description: Set true to use Rent Now Pay Later
 *     responses:
 *       201:
 *         description: Rental started successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Rental started successfully
 *                 rental:
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                     deviceType:
 *                       type: string
 *                       example: powerbank
 *                     rentalAmount:
 *                       type: number
 *                       example: 300
 *                     depositAmount:
 *                       type: number
 *                       example: 500
 *                     totalPaid:
 *                       type: number
 *                       example: 800
 *                     selectedHours:
 *                       type: number
 *                       example: 4
 *                     startTime:
 *                       type: string
 *                       format: date-time
 *                     expectedReturnTime:
 *                       type: string
 *                       format: date-time
 *                     confirmationCode:
 *                       type: string
 *                       example: "4821"
 *                     lockerAssigned:
 *                       type: string
 *                       example: PB-3
 *                     lockerStatus:
 *                       type: string
 *                       example: unlocked
 *                     status:
 *                       type: string
 *                       example: active
 *                     paymentType:
 *                       type: string
 *                       example: wallet
 *                 locker:
 *                   type: object
 *                   properties:
 *                     assigned:
 *                       type: string
 *                       example: PB-3
 *                     status:
 *                       type: string
 *                       example: UNLOCKED ✅
 *                     message:
 *                       type: string
 *                       example: Locker PB-3 is now open. Please collect your powerbank.
 *                 walletBalance:
 *                   type: number
 *                   example: 1700
 *       400:
 *         description: |
 *           Insufficient wallet balance, invalid hours,
 *           RNPL not enabled, or outstanding RNPL debt
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                 required:
 *                   type: number
 *                 available:
 *                   type: number
 *                 shortfall:
 *                   type: number
 *       404:
 *         description: No available device at this station or station not found
 */
router.post(
  '/',
  protect,
  authorize('student'),
  validateStartRental,
  startRental
)

// ─────────────────────────────────────────────────
// GET MY RENTALS
// ─────────────────────────────────────────────────

/**
 * @swagger
 * /api/v1/rentals:
 *   get:
 *     summary: Get my rental history with pagination
 *     tags: [Rentals]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [active, returned, overdue, cancelled]
 *         description: Filter by rental status
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *     responses:
 *       200:
 *         description: Paginated rental history
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 count:
 *                   type: number
 *                 total:
 *                   type: number
 *                 page:
 *                   type: number
 *                 rentals:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Rental'
 */
router.get('/', protect, getMyRentals)

// ─────────────────────────────────────────────────
// GET SINGLE RENTAL
// ─────────────────────────────────────────────────

/**
 * @swagger
 * /api/v1/rentals/{id}:
 *   get:
 *     summary: Get single rental details
 *     tags: [Rentals]
 *     security:
 *       - bearerAuth: []
 *     description: |
 *       Returns full rental details.
 *       Automatically marks rental as overdue if past expected return time.
 *       Audit log created when overdue status is set.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: MongoDB rental ID
 *     responses:
 *       200:
 *         description: Rental details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 rental:
 *                   $ref: '#/components/schemas/Rental'
 *       404:
 *         description: Rental not found
 */
router.get('/:id', protect, getRental)

// ─────────────────────────────────────────────────
// INITIATE RETURN
// ─────────────────────────────────────────────────

/**
 * @swagger
 * /api/v1/rentals/{id}/initiate-return:
 *   post:
 *     summary: Step 1 of return — get confirmation code and instructions
 *     tags: [Rentals]
 *     security:
 *       - bearerAuth: []
 *     description: |
 *       Initiates the device return process.
 *       Returns the 4-digit confirmation code and step-by-step instructions.
 *
 *       **Return Steps:**
 *       1. Student calls this endpoint to get their code
 *       2. Student goes to station and hands device to operator
 *       3. Operator confirms on their dashboard
 *       4. Student enters code at PATCH /confirm-return
 *       5. Deposit refunded instantly to wallet
 *
 *       If rental is overdue, a late fee warning is included in the response.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Return initiated. Confirmation code returned.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                 rentalId:
 *                   type: string
 *                 confirmationCode:
 *                   type: string
 *                   example: "4821"
 *                 deviceType:
 *                   type: string
 *                   example: powerbank
 *                 station:
 *                   type: object
 *                   properties:
 *                     name:
 *                       type: string
 *                     location:
 *                       type: string
 *                 lateFeeWarning:
 *                   type: object
 *                   nullable: true
 *                   properties:
 *                     isLate:
 *                       type: boolean
 *                     hoursLate:
 *                       type: number
 *                     estimatedLateFee:
 *                       type: number
 *                     estimatedRefund:
 *                       type: number
 *                 instructions:
 *                   type: array
 *                   items:
 *                     type: string
 *       404:
 *         description: No active rental found
 */
router.post(
  '/:id/initiate-return',
  protect,
  authorize('student'),
  initiateReturn
)

// ─────────────────────────────────────────────────
// CONFIRM RETURN
// ─────────────────────────────────────────────────

/**
 * @swagger
 * /api/v1/rentals/{id}/confirm-return:
 *   patch:
 *     summary: Step 2 of return — enter 4-digit code to complete return
 *     tags: [Rentals]
 *     security:
 *       - bearerAuth: []
 *     description: |
 *       Completes the device return after operator has confirmed.
 *
 *       **What happens on success:**
 *       - Rental marked as returned
 *       - Device freed for next student
 *       - Late fee calculated if overdue
 *       - Deposit (minus late fee) refunded instantly to wallet
 *       - Trust score updated (+1 normal, +2 early, -1 late)
 *       - RNPL unlocked if trust score reaches 10
 *       - Audit log and reconciliation record created
 *       - Email notification sent
 *
 *       **Late fee policy:**
 *       - Up to 2 hours late: ₦100 deducted from deposit
 *       - More than 2 hours late: ₦200 deducted from deposit
 *       - On time or early: full deposit refunded
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
 *                 description: 4-digit code from initiate-return response
 *     responses:
 *       200:
 *         description: Return confirmed. Deposit refunded.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Device returned successfully. Deposit refunded!
 *                 rental:
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                     deviceType:
 *                       type: string
 *                     status:
 *                       type: string
 *                       example: returned
 *                     startTime:
 *                       type: string
 *                       format: date-time
 *                     expectedReturnTime:
 *                       type: string
 *                       format: date-time
 *                     actualReturnTime:
 *                       type: string
 *                       format: date-time
 *                     rentalAmount:
 *                       type: number
 *                     depositAmount:
 *                       type: number
 *                     lateFee:
 *                       type: number
 *                       example: 0
 *                     depositRefunded:
 *                       type: number
 *                       example: 500
 *                     isEarlyReturn:
 *                       type: boolean
 *                 walletBalance:
 *                   type: number
 *                   example: 2200
 *                 trustScore:
 *                   type: object
 *                   nullable: true
 *                   properties:
 *                     trustScore:
 *                       type: number
 *                       example: 11
 *                     trustLevel:
 *                       type: string
 *                       example: trusted
 *                     rnplEnabled:
 *                       type: boolean
 *                       example: true
 *                     pointsEarned:
 *                       type: number
 *                       example: 1
 *       400:
 *         description: |
 *           Invalid confirmation code or
 *           operator has not confirmed yet
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                 step:
 *                   type: string
 *                   example: AWAITING_OPERATOR_CONFIRMATION
 *       404:
 *         description: No active rental found
 */
router.patch(
  '/:id/confirm-return',
  protect,
  authorize('student'),
  confirmReturn
)

// ─────────────────────────────────────────────────
// CANCEL RENTAL
// ─────────────────────────────────────────────────

/**
 * @swagger
 * /api/v1/rentals/{id}/cancel:
 *   patch:
 *     summary: Cancel rental within 5 minutes — full refund
 *     tags: [Rentals]
 *     security:
 *       - bearerAuth: []
 *     description: |
 *       Allows a student to cancel a rental within 5 minutes of starting.
 *       Full refund of rental fee + deposit returned to wallet instantly.
 *
 *       After 5 minutes the cancellation window closes and the student
 *       must return the device normally via initiate-return and confirm-return.
 *
 *       Audit log created on every cancellation attempt.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: MongoDB rental ID
 *     responses:
 *       200:
 *         description: Rental cancelled. Full refund to wallet.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Rental cancelled. Full refund of ₦800 returned to your wallet.
 *                 rental:
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                     deviceType:
 *                       type: string
 *                     status:
 *                       type: string
 *                       example: cancelled
 *                     refundAmount:
 *                       type: number
 *                       example: 800
 *                 walletBalance:
 *                   type: number
 *                   example: 3000
 *       400:
 *         description: |
 *           Cancellation window closed (more than 5 minutes since start)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                 minutesSinceStart:
 *                   type: number
 *                 cancellationWindow:
 *                   type: string
 *                   example: 5 minutes
 *       404:
 *         description: No active rental found
 */
router.patch(
  '/:id/cancel',
  protect,
  authorize('student'),
  cancelRental
)

module.exports = router