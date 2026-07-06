// src/middleware/timeout.middleware.js

const timeout = (ms = 25000) => (req, res, next) => {
  const timer = setTimeout(() => {
    if (!res.headersSent) {
      console.error(`⏱️ Request timeout: ${req.method} ${req.path}`)
      res.status(503).json({
        success: false,
        message: 'Request timed out. Please try again.',
        code: 'REQUEST_TIMEOUT',
      })
    }
  }, ms)

  res.on('finish', () => clearTimeout(timer))
  res.on('close', () => clearTimeout(timer))

  next()
}

module.exports = timeout