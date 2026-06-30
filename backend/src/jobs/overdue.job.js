// src/jobs/overdue.job.js

const cron = require('node-cron')
const Rental = require('../models/Rental')
const Notification = require('../models/Notification')
const { createAuditLog } = require('../services/audit.service')

const checkOverdueRentals = async () => {
  try {
    console.log('🔄 Running overdue rental check...')

    const overdueRentals = await Rental.find({
      status: 'active',
      expectedReturnTime: { $lt: new Date() }
    }).populate('userId', 'name email')

    if (overdueRentals.length === 0) {
      console.log('✅ No overdue rentals found')
      return
    }

    for (const rental of overdueRentals) {
      // Update status
      rental.status = 'overdue'
      await rental.save()

      // Notify student
      await Notification.create({
        userId: rental.userId._id,
        title: '⚠️ Rental Overdue',
        message: `Your ${rental.deviceType} rental is overdue. Please return it immediately to avoid additional charges.`,
        type: 'rental_overdue',
        rentalId: rental._id
      })

      // Audit log
      await createAuditLog({
        userId: rental.userId._id,
        role: 'system',
        action: 'RENTAL_OVERDUE',
        resourceType: 'Rental',
        resourceId: rental._id,
        metadata: {
          deviceType: rental.deviceType,
          expectedReturnTime: rental.expectedReturnTime,
          hoursOverdue: Math.ceil(
            (new Date() - rental.expectedReturnTime) /
            (1000 * 60 * 60)
          )
        },
        status: 'warning'
      })
    }

    console.log(
      `⚠️ Marked ${overdueRentals.length} rental(s) as overdue`
    )

  } catch (error) {
    console.error('❌ Overdue check failed:', error.message)
  }
}

// Run every hour
const startOverdueJob = () => {
  cron.schedule('0 * * * *', checkOverdueRentals)
  console.log('✅ Overdue rental checker started')
}

module.exports = { startOverdueJob, checkOverdueRentals }