const express = require('express')
const router = express.Router()
const {
  getNotifications,
  markAsRead,
  markOneAsRead
} = require('../controllers/notification.controller')
const { protect } = require('../middleware/auth.middleware')
const { cacheMiddleware } = require('../services/cache.service')

/**
 * @swagger
 * tags:
 *   name: Notifications
 *   description: In-app notifications
 */

/**
 * @swagger
 * /api/v1/notifications:
 *   get:
 *     summary: Get notifications with unread count
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Notifications list
 */
router.get(
  '/',
  protect,
  cacheMiddleware(30, (req) => `notifs:${req.user._id}`),
  getNotifications
)

/**
 * @swagger
 * /api/v1/notifications/read-all:
 *   patch:
 *     summary: Mark all as read
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: All marked as read
 */
router.patch('/read-all', protect, markAsRead)

/**
 * @swagger
 * /api/v1/notifications/{id}/read:
 *   patch:
 *     summary: Mark one as read
 *     tags: [Notifications]
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
 *         description: Notification marked as read
 */
router.patch('/:id/read', protect, markOneAsRead)

module.exports = router