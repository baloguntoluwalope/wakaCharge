const express = require('express')
const router = express.Router()
const {
  getOperatorDashboard, getActiveRentals,
  operatorConfirmReturn, reportDeviceDamaged,
  getInventory, clockIn, clockOut, searchStudent,
  registerStudentForOperator
} = require('../controllers/operator.controller')
const {
  protect, authorize
} = require('../middleware/auth.middleware')

/**
 * @swagger
 * tags:
 *   name: Operator
 *   description: Kiosk operator management
 */

/**
 * @swagger
 * /api/v1/operator/dashboard:
 *   get:
 *     summary: Operator dashboard
 *     tags: [Operator]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Active rentals, inventory, alerts
 */
router.get(
  '/dashboard',
  protect,
  authorize('operator', 'admin'),
  getOperatorDashboard
)

/**
 * @swagger
 * /api/v1/operator/rentals/active:
 *   get:
 *     summary: Get active rentals at operator station
 *     tags: [Operator]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Active rentals
 */
router.get(
  '/rentals/active',
  protect,
  authorize('operator', 'admin'),
  getActiveRentals
)

/**
 * @swagger
 * /api/v1/operator/confirm-return:
 *   post:
 *     summary: Operator confirms device physically received
 *     tags: [Operator]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [rentalId]
 *             properties:
 *               rentalId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Confirmed. Student can now enter code.
 */
router.post(
  '/confirm-return',
  protect,
  authorize('operator', 'admin'),
  operatorConfirmReturn
)

/**
 * @swagger
 * /api/v1/operator/report-damage:
 *   post:
 *     summary: Report device as damaged
 *     tags: [Operator]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [deviceId]
 *             properties:
 *               deviceId:
 *                 type: string
 *               damageReport:
 *                 type: string
 *     responses:
 *       200:
 *         description: Device reported as damaged
 */
router.post(
  '/report-damage',
  protect,
  authorize('operator', 'admin'),
  reportDeviceDamaged
)

/**
 * @swagger
 * /api/v1/operator/inventory:
 *   get:
 *     summary: Get station inventory
 *     tags: [Operator]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Full inventory list
 */
router.get(
  '/inventory',
  protect,
  authorize('operator', 'admin'),
  getInventory
)

/**
 * @swagger
 * /api/v1/operator/shift/clock-in:
 *   post:
 *     summary: Clock in for shift
 *     tags: [Operator]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Clocked in. Inventory snapshot saved.
 */
router.post(
  '/shift/clock-in',
  protect,
  authorize('operator', 'admin'),
  clockIn
)

/**
 * @swagger
 * /api/v1/operator/shift/clock-out:
 *   post:
 *     summary: Clock out. Inventory saved for next shift.
 *     tags: [Operator]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               clockInTime:
 *                 type: string
 *     responses:
 *       200:
 *         description: Clocked out with shift summary
 */
router.post(
  '/shift/clock-out',
  protect,
  authorize('operator', 'admin'),
  clockOut
)

/**
 * @swagger
 * /api/v1/operator/search-student:
 *   get:
 *     summary: Search student by name, email or phone
 *     tags: [Operator]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: query
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Matching students
 */
router.get(
  '/search-student',
  protect,
  authorize('operator', 'admin'),
  searchStudent
)

/**
 * @swagger
 * /api/v1/operator/register-student:
 *   post:
 *     summary: Operator registers a student on their behalf at the kiosk
 *     tags: [Operator]
 *     security:
 *       - bearerAuth: []
 *     description: |
 *       Allows an operator (or admin) to create a student account directly at
 *       the kiosk. A Nomba virtual account is generated automatically and a
 *       welcome email with login credentials is sent to the student.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, email, phone]
 *             properties:
 *               name:
 *                 type: string
 *                 example: Amaka Okafor
 *               email:
 *                 type: string
 *                 example: amaka@example.com
 *               phone:
 *                 type: string
 *                 example: "08012345678"
 *               campus:
 *                 type: string
 *                 example: LASU
 *               studentId:
 *                 type: string
 *                 example: LASU/2021/0123
 *               password:
 *                 type: string
 *                 description: Optional — auto-generated if omitted
 *     responses:
 *       201:
 *         description: Student registered successfully
 *       403:
 *         description: Only operators or admins can register students at kiosk
 *       409:
 *         description: Email or phone already registered
 */
router.post(
  '/register-student',
  protect,
  authorize('operator', 'admin'),
  registerStudentForOperator
)

module.exports = router