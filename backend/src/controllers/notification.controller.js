const Notification = require('../models/Notification')

const getNotifications = async (req, res) => {
  const notifications = await Notification.find({
    userId: req.user._id
  }).sort({ createdAt: -1 }).limit(30)

  const unreadCount = await Notification.countDocuments({
    userId: req.user._id,
    isRead: false
  })

  res.status(200).json({
    success: true,
    unreadCount,
    count: notifications.length,
    notifications
  })
}

const markAsRead = async (req, res) => {
  await Notification.updateMany(
    { userId: req.user._id, isRead: false },
    { isRead: true }
  )
  res.status(200).json({
    success: true,
    message: 'All notifications marked as read'
  })
}

const markOneAsRead = async (req, res) => {
  await Notification.findByIdAndUpdate(
    req.params.id, { isRead: true }
  )
  res.status(200).json({
    success: true,
    message: 'Notification marked as read'
  })
}

module.exports = {
  getNotifications,
  markAsRead,
  markOneAsRead
}