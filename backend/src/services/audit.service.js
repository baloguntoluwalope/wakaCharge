const AuditLog = require('../models/AuditLog')

const createAuditLog = async ({
  userId = null,
  role = 'system',
  action,
  resourceType = null,
  resourceId = null,
  previousState = null,
  newState = null,
  metadata = {},
  ipAddress = null,
  userAgent = null,
  status = 'success',
  errorMessage = null
}) => {
  try {
    const log = await AuditLog.create({
      userId,
      role,
      action,
      resourceType,
      resourceId,
      previousState,
      newState,
      metadata,
      ipAddress,
      userAgent,
      status,
      errorMessage
    })
    return log
  } catch (error) {
    // Never let audit log failure break the main flow
    console.error('❌ Audit log creation failed:', error.message)
    return null
  }
}

// Get audit trail for a specific resource
const getResourceAuditTrail = async (
  resourceType,
  resourceId
) => {
  return await AuditLog.find({
    resourceType,
    resourceId
  })
    .sort({ createdAt: -1 })
    .populate('userId', 'name email role')
}

// Get audit trail for a user
const getUserAuditTrail = async (userId, limit = 50) => {
  return await AuditLog.find({ userId })
    .sort({ createdAt: -1 })
    .limit(limit)
}

module.exports = {
  createAuditLog,
  getResourceAuditTrail,
  getUserAuditTrail
}