const express = require('express')
const router = express.Router()
const {
  getAdminDashboard,
  getAllUsers,
  createOperator,
  getAllRentals,
  getRevenue,
  deactivateUser,
  getAnalytics
} = require('../controllers/admin.controller')
const {
  protect,
  authorize
} = require('../middleware/auth.middleware')

/**
 * @swagger
 * tags:
 *   name: Admin
 *   description: |
 *     Admin-only platform management.
 *     Full access to users, rentals, revenue, analytics and audit trails.
 *     All endpoints require admin JWT token.
 */

// ─────────────────────────────────────────────────
// DASHBOARD
// ─────────────────────────────────────────────────

/**
 * @swagger
 * /api/v1/admin/dashboard:
 *   get:
 *     summary: Full admin dashboard — users, revenue, rentals, analytics
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Complete platform statistics
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 dashboard:
 *                   type: object
 *                   properties:
 *                     users:
 *                       type: object
 *                       properties:
 *                         total:
 *                           type: number
 *                           example: 1250
 *                         students:
 *                           type: number
 *                           example: 1200
 *                         operators:
 *                           type: number
 *                           example: 50
 *                     stations:
 *                       type: number
 *                       example: 12
 *                     devices:
 *                       type: object
 *                       properties:
 *                         total:
 *                           type: number
 *                         status:
 *                           type: array
 *                     rentals:
 *                       type: object
 *                       properties:
 *                         active:
 *                           type: number
 *                         today:
 *                           type: number
 *                         overdue:
 *                           type: number
 *                     revenue:
 *                       type: object
 *                       properties:
 *                         today:
 *                           type: number
 *                           example: 45000
 *                         weekly:
 *                           type: number
 *                           example: 280000
 *                         monthly:
 *                           type: number
 *                           example: 1200000
 *                     analytics:
 *                       type: object
 *                       properties:
 *                         mostRentedDevice:
 *                           type: string
 *                           example: powerbank
 *                         rentalsByType:
 *                           type: array
 *       401:
 *         description: Not authorized
 *       403:
 *         description: Admin access required
 */
router.get(
  '/dashboard',
  protect,
  authorize('admin'),
  getAdminDashboard
)

// ─────────────────────────────────────────────────
// ANALYTICS
// ─────────────────────────────────────────────────

/**
 * @swagger
 * /api/v1/admin/analytics:
 *   get:
 *     summary: Deep analytics — peak hours, campus stats, device popularity, revenue trends
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     description: |
 *       Advanced analytics including:
 *       - Peak rental hours across all campuses
 *       - Revenue and rental count per campus
 *       - Most popular device types
 *       - Weekly revenue trend for last 7 days
 *     responses:
 *       200:
 *         description: Full analytics breakdown
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 analytics:
 *                   type: object
 *                   properties:
 *                     peakRentalHours:
 *                       type: array
 *                       description: Top 5 busiest hours
 *                       items:
 *                         type: object
 *                         properties:
 *                           _id:
 *                             type: number
 *                             description: Hour of day 0-23
 *                             example: 14
 *                           count:
 *                             type: number
 *                             example: 145
 *                     campusPerformance:
 *                       type: array
 *                       description: Revenue and rental count per campus
 *                       items:
 *                         type: object
 *                         properties:
 *                           _id:
 *                             type: string
 *                             example: LASU
 *                           totalRevenue:
 *                             type: number
 *                           totalRentals:
 *                             type: number
 *                     devicePopularity:
 *                       type: array
 *                       description: Device types ranked by rental count
 *                     weeklyTrend:
 *                       type: array
 *                       description: Daily revenue for last 7 days
 *       403:
 *         description: Admin access required
 */
router.get(
  '/analytics',
  protect,
  authorize('admin'),
  getAnalytics
)

// ─────────────────────────────────────────────────
// USERS
// ─────────────────────────────────────────────────

/**
 * @swagger
 * /api/v1/admin/users:
 *   get:
 *     summary: Get all users with filters and pagination
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: role
 *         schema:
 *           type: string
 *           enum: [student, operator, admin]
 *         description: Filter by role
 *       - in: query
 *         name: campus
 *         schema:
 *           type: string
 *           enum:
 *             - LASU
 *             - UI
 *             - UNILAG
 *             - OAU
 *             - FUTA
 *             - UNIBEN
 *             - ABU
 *             - UNN
 *             - UNIPORT
 *             - LAUTECH
 *         description: Filter by campus
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
 *         description: Paginated list of users
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
 *                 users:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/User'
 */
router.get(
  '/users',
  protect,
  authorize('admin'),
  getAllUsers
)

// ─────────────────────────────────────────────────
// OPERATORS
// ─────────────────────────────────────────────────

/**
 * @swagger
 * /api/v1/admin/operators:
 *   post:
 *     summary: Create a new operator account
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     description: |
 *       Creates an operator account and assigns them to a station.
 *       Operators use email + password to login (no OTP).
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, email, phone, password, campus]
 *             properties:
 *               name:
 *                 type: string
 *                 example: John Operator
 *               email:
 *                 type: string
 *                 example: operator@wakacharge.com
 *               phone:
 *                 type: string
 *                 example: "08087654321"
 *               password:
 *                 type: string
 *                 example: operator123
 *               campus:
 *                 type: string
 *                 example: LASU
 *               stationId:
 *                 type: string
 *                 description: MongoDB ID of station to assign
 *                 example: 664f1b2c3d4e5f6a7b8c9d0e
 *     responses:
 *       201:
 *         description: Operator created and assigned to station
 *       409:
 *         description: Email or phone already exists
 */
router.post(
  '/operators',
  protect,
  authorize('admin'),
  createOperator
)

// ─────────────────────────────────────────────────
// RENTALS
// ─────────────────────────────────────────────────

/**
 * @swagger
 * /api/v1/admin/rentals:
 *   get:
 *     summary: Get all rentals across all campuses with filters
 *     tags: [Admin]
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
 *         name: deviceType
 *         schema:
 *           type: string
 *           enum: [powerbank, studylamp, survivalkit, comfortkit]
 *       - in: query
 *         name: campus
 *         schema:
 *           type: string
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
 *         description: Paginated list of all rentals
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
router.get(
  '/rentals',
  protect,
  authorize('admin'),
  getAllRentals
)

// ─────────────────────────────────────────────────
// REVENUE
// ─────────────────────────────────────────────────

/**
 * @swagger
 * /api/v1/admin/revenue:
 *   get:
 *     summary: Revenue analytics with daily breakdown
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: [7days, 30days, 90days]
 *           default: 7days
 *         description: Time period for revenue report
 *     responses:
 *       200:
 *         description: Revenue data with daily breakdown
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 period:
 *                   type: string
 *                   example: 7days
 *                 totalRevenue:
 *                   type: number
 *                   example: 280000
 *                 dailyRevenue:
 *                   type: object
 *                   example:
 *                     "2026-06-24": 35000
 *                     "2026-06-25": 42000
 *                 transactions:
 *                   type: number
 *                   example: 145
 */
router.get(
  '/revenue',
  protect,
  authorize('admin'),
  getRevenue
)

// ─────────────────────────────────────────────────
// USER MANAGEMENT
// ─────────────────────────────────────────────────

/**
 * @swagger
 * /api/v1/admin/users/{id}/deactivate:
 *   patch:
 *     summary: Deactivate a user account
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: MongoDB user ID
 *     responses:
 *       200:
 *         description: User deactivated successfully
 *       404:
 *         description: User not found
 */
router.patch(
  '/users/:id/deactivate',
  protect,
  authorize('admin'),
  deactivateUser
)

module.exports = router