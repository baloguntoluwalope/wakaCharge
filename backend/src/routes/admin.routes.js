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
  activateUser,
  getAnalytics,
  getPendingOperators,   // ← was missing
  approveOperator,       // ← was missing
  rejectOperator         // ← was missing
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
 *     responses:
 *       200:
 *         description: Full analytics breakdown
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
 *         description: Paginated list of users
 */
router.get(
  '/users',
  protect,
  authorize('admin'),
  getAllUsers
)

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
 *         description: User reactivated successfully
 *       404:
 *         description: User not found
 */
router.patch(
  '/users/:id/activate',
  protect,
  authorize('admin'),
  activateUser
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

/**
 * @swagger
 * /api/v1/admin/operators/{id}/onboard:
 *   patch:
 *     summary: Onboard an existing user as an operator
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
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               stationId:
 *                 type: string
 *     responses:
 *       200:
 *         description: User onboarded as operator
 *       400:
 *         description: Invalid role transition
 *       404:
 *         description: User or station not found
 */
router.patch(
  '/operators/:id/onboard',
  protect,
  authorize('admin'),
  onboardOperator
)

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
 *     responses:
 *       200:
 *         description: Operator reassigned
 *       400:
 *         description: User is not an operator
 *       404:
 *         description: User or station not found
 */
router.patch(
  '/operators/:id/reassign',
  protect,
  authorize('admin'),
  reassignOperator
)

/**
 * @swagger
 * /api/v1/admin/operators/pending:
 *   get:
 *     summary: List operators awaiting approval
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     description: Returns operators who self-registered via /api/v1/auth/operator/register and have not yet been approved or rejected.
 *     responses:
 *       200:
 *         description: List of pending operators
 *       401:
 *         description: Not authorized
 *       403:
 *         description: Not an admin
 */
router.get(
  '/operators/pending',
  protect,
  authorize('admin'),
  getPendingOperators
)

/**
 * @swagger
 * /api/v1/admin/operators/{id}/approve:
 *   post:
 *     summary: Approve a pending operator
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
 *         description: Operator approved successfully
 *       401:
 *         description: Not authorized
 *       403:
 *         description: Not an admin
 *       404:
 *         description: Operator not found
 *       409:
 *         description: Operator already approved or rejected
 */
router.post(
  '/operators/:id/approve',
  protect,
  authorize('admin'),
  approveOperator
)

/**
 * @swagger
 * /api/v1/admin/operators/{id}/reject:
 *   post:
 *     summary: Reject a pending operator
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
 *         description: Operator rejected successfully
 *       401:
 *         description: Not authorized
 *       403:
 *         description: Not an admin
 *       404:
 *         description: Operator not found
 *       409:
 *         description: Operator already approved or rejected
 */
router.post(
  '/operators/:id/reject',
  protect,
  authorize('admin'),
  rejectOperator
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
 *     responses:
 *       200:
 *         description: Revenue data with daily breakdown
 */
router.get(
  '/revenue',
  protect,
  authorize('admin'),
  getRevenue
)

module.exports = router