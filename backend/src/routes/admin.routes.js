const express = require('express')
const router = express.Router()
const {
  getAdminDashboard,
  getAllUsers,
  createOperator,
  onboardOperator,
  reassignOperator,
  getAllRentals,
  getRevenue,
  deactivateUser,
  activateUser
} = require('../controllers/admin.controller')
const { protect, authorize } = require('../middleware/auth.middleware')

/**
 * @swagger
 * tags:
 *   name: Admin
 *   description: Admin platform management
 */

const adminOnly = [protect, authorize('admin')]

// ─── Dashboard ────────────────────────────────────────────────────────────────

/**
 * @swagger
 * /api/v1/admin/dashboard:
 *   get:
 *     summary: Full admin dashboard
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Users, revenue, rentals, analytics
 */
router.get('/dashboard', ...adminOnly, getAdminDashboard)

// ─── Users ────────────────────────────────────────────────────────────────────

/**
 * @swagger
 * /api/v1/admin/users:
 *   get:
 *     summary: Get all users with optional filters
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: role
 *         schema:
 *           type: string
 *           enum: [student, operator, admin]
 *       - in: query
 *         name: campus
 *         schema:
 *           type: string
 *       - in: query
 *         name: page
 *         schema:
 *           type: number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: number
 *     responses:
 *       200:
 *         description: Paginated users list
 */
router.get('/users', ...adminOnly, getAllUsers)

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
 *     responses:
 *       200:
 *         description: User deactivated
 *       404:
 *         description: User not found
 */
router.patch('/users/:id/deactivate', ...adminOnly, deactivateUser)

/**
 * @swagger
 * /api/v1/admin/users/{id}/activate:
 *   patch:
 *     summary: Reactivate a deactivated user account
 *     tags: [Admin]
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
 *         description: User reactivated
 *       404:
 *         description: User not found
 */
router.patch('/users/:id/activate', ...adminOnly, activateUser)

// ─── Operators ────────────────────────────────────────────────────────────────

/**
 * @swagger
 * /api/v1/admin/operators:
 *   post:
 *     summary: Create a brand new operator account
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     description: Creates a fresh operator account. To promote an existing user, use PATCH /operators/{id}/onboard instead.
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
 *                 example: Chidi Okeke
 *               email:
 *                 type: string
 *                 example: chidi@wakacharge.com
 *               phone:
 *                 type: string
 *                 example: "08087654321"
 *               password:
 *                 type: string
 *                 example: operator123
 *               campus:
 *                 type: string
 *                 example: UNILAG
 *               stationId:
 *                 type: string
 *                 example: 64b1f2c3d4e5f6a7b8c9d0e1
 *                 description: Optional — assign to a station immediately
 *     responses:
 *       201:
 *         description: Operator created successfully
 *       409:
 *         description: Email or phone already exists
 */
router.post('/operators', ...adminOnly, createOperator)

/**
 * @swagger
 * /api/v1/admin/operators/{id}/onboard:
 *   patch:
 *     summary: Onboard an existing user as an operator
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     description: |
 *       Promotes an existing student to operator role.
 *       Optionally assigns them to a station at the same time.
 *       Use this when a user already registered and admin wants to make them an operator.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The user's MongoDB _id
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               stationId:
 *                 type: string
 *                 example: 64b1f2c3d4e5f6a7b8c9d0e1
 *                 description: Optional — assign to a station during onboarding
 *     responses:
 *       200:
 *         description: User onboarded as operator successfully
 *       400:
 *         description: User is already an operator or is an admin
 *       404:
 *         description: User or station not found
 */
router.patch('/operators/:id/onboard', ...adminOnly, onboardOperator)

/**
 * @swagger
 * /api/v1/admin/operators/{id}/reassign:
 *   patch:
 *     summary: Reassign an operator to a different station
 *     tags: [Admin]
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
 *             required: [stationId]
 *             properties:
 *               stationId:
 *                 type: string
 *                 example: 64b1f2c3d4e5f6a7b8c9d0e2
 *     responses:
 *       200:
 *         description: Operator reassigned successfully
 *       400:
 *         description: User is not an operator or stationId missing
 *       404:
 *         description: User or station not found
 */
router.patch('/operators/:id/reassign', ...adminOnly, reassignOperator)

// ─── Rentals ──────────────────────────────────────────────────────────────────

/**
 * @swagger
 * /api/v1/admin/rentals:
 *   get:
 *     summary: Get all rentals across the platform
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [active, returned, overdue, cancelled]
 *       - in: query
 *         name: page
 *         schema:
 *           type: number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: number
 *     responses:
 *       200:
 *         description: All rentals paginated
 */
router.get('/rentals', ...adminOnly, getAllRentals)

// ─── Revenue ──────────────────────────────────────────────────────────────────

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
 *     responses:
 *       200:
 *         description: Revenue totals and daily breakdown
 */
router.get('/revenue', ...adminOnly, getRevenue)

module.exports = router