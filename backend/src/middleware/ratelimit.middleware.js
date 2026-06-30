// src/middleware/ratelimit.middleware.js

const rateLimit = require('express-rate-limit')

// General API limit
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: {
    success: false,
    message: 'Too many requests. Please try again in 15 minutes.'
  }
})

// Strict limit for OTP endpoints
const otpLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 3,
  message: {
    success: false,
    message: 'Too many OTP requests. Please wait 1 minute.'
  }
})

// Strict limit for payment endpoints
const paymentLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  message: {
    success: false,
    message: 'Too many payment requests. Please slow down.'
  }
})

module.exports = {
  apiLimiter,
  otpLimiter,
  paymentLimiter
}