const IdempotencyKey = require('../models/IdempotencyKey')

// Check if request was already processed
const checkIdempotency = async (key, userId, action) => {
  const existing = await IdempotencyKey.findOne({ key })

  if (!existing) return null

  // If still processing — another request is in flight
  if (existing.status === 'processing') {
    return {
      isDuplicate: true,
      isProcessing: true,
      message: 'Request is still being processed'
    }
  }

  // If completed — return cached response
  if (existing.status === 'completed') {
    return {
      isDuplicate: true,
      isProcessing: false,
      cachedResponse: existing.responseBody
    }
  }

  return null
}

// Save idempotency key when request starts
const saveIdempotencyKey = async (
  key, userId, action, requestBody
) => {
  try {
    await IdempotencyKey.create({
      key, userId, action, requestBody,
      status: 'processing'
    })
  } catch (error) {
    // Key already exists — duplicate request
    if (error.code === 11000) {
      return false
    }
    throw error
  }
  return true
}

// Mark idempotency key as completed
const completeIdempotencyKey = async (key, responseBody) => {
  await IdempotencyKey.findOneAndUpdate(
    { key },
    { status: 'completed', responseBody },
    { new: true }
  )
}

// Mark as failed
const failIdempotencyKey = async (key, error) => {
  await IdempotencyKey.findOneAndUpdate(
    { key },
    {
      status: 'failed',
      responseBody: { error: error.message }
    }
  )
}

module.exports = {
  checkIdempotency,
  saveIdempotencyKey,
  completeIdempotencyKey,
  failIdempotencyKey
}