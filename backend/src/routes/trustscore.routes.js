const express = require('express')
const router = express.Router()
const {
  getTrustScore,
  payRNPLDebt,
  getRNPLStudents
} = require('../controllers/trustscore.controller')
const {
  protect, authorize
} = require('../middleware/auth.middleware')

/**
 * @swagger
 * tags:
 *   name: Trust Score
 *   description: Student trust score and RNPL system
 */

/**
 * @swagger
 * /api/v1/trust/score:
 *   get:
 *     summary: Get my trust score and RNPL status
 *     tags: [Trust Score]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Trust profile with score, level, RNPL status
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 trustProfile:
 *                   type: object
 *                   properties:
 *                     trustScore:
 *                       type: number
 *                       example: 12
 *                     trustLevel:
 *                       type: string
 *                       example: trusted
 *                     rnplEnabled:
 *                       type: boolean
 *                       example: true
 *                     rnplLimit:
 *                       type: number
 *                       example: 1000
 *                     nextLevel:
 *                       type: object
 *                       properties:
 *                         level:
 *                           type: string
 *                           example: silver
 *                         needed:
 *                           type: number
 *                           example: 6
 */
router.get(
  '/score',
  protect,
  getTrustScore
)

/**
 * @swagger
 * /api/v1/trust/pay-rnpl:
 *   post:
 *     summary: Pay outstanding RNPL balance from wallet
 *     tags: [Trust Score]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: RNPL balance cleared
 *       400:
 *         description: Insufficient wallet balance or no outstanding debt
 */
router.post(
  '/pay-rnpl',
  protect,
  authorize('student'),
  payRNPLDebt
)

/**
 * @swagger
 * /api/v1/trust/rnpl-students:
 *   get:
 *     summary: Get all RNPL students (Admin only)
 *     tags: [Trust Score]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: RNPL students with defaulter count
 */
router.get(
  '/rnpl-students',
  protect,
  authorize('admin'),
  getRNPLStudents
)

module.exports = router