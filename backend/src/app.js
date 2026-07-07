require('dotenv').config()
require('express-async-errors')

const express = require('express')
const cors = require('cors')
const compression = require('compression')
const keepAlive = require('./jobs/keepalive.job')
const swaggerUi = require('swagger-ui-express')
const swaggerSpec = require('./config/swagger')
const connectDB = require('./config/db')
const errorHandler = require('./middleware/error.middleware')
const timeout = require('./middleware/timeout.middleware')
const rateLimits = require('./middleware/ratelimit.middleware')

// Routes Imports
const authRoutes = require('./routes/auth.routes')
const stationRoutes = require('./routes/station.routes')
const deviceRoutes = require('./routes/device.routes')
const rentalRoutes = require('./routes/rental.routes')
const paymentRoutes = require('./routes/payment.routes')
const operatorRoutes = require('./routes/operator.routes')
const adminRoutes = require('./routes/admin.routes')
const notificationRoutes = require('./routes/notification.routes')
const trustScoreRoutes = require('./routes/trustscore.routes')

connectDB()

const app = express()

// ─── 1. GLOBAL MIDDLEWARES ───────────────────────────────────────────
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-nomba-signature'],
  credentials: false
}))
app.options('*', cors())

app.use(compression({
  level: 6,
  threshold: 1024,
  filter: (req, res) => {
    if (req.headers['x-no-compression']) return false
    return compression.filter(req, res)
  }
}))

app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// ─── 2. PUBLIC UTILITY ENDPOINTS ────────────────────────────────────
app.use(
  '/api-docs',
  swaggerUi.serve,
  swaggerUi.setup(swaggerSpec, {
    customCss: `
      .swagger-ui .topbar { background-color: #0D1B2A; }
      .swagger-ui .topbar-wrapper::after {
        content: '⚡ Waka Charge API';
        color: #f59e0b;
        font-size: 18px;
        font-weight: bold;
        padding-left: 20px;
      }
      .swagger-ui .topbar-wrapper img { display: none; }
      .swagger-ui .info .title { color: #0D1B2A; }
      .swagger-ui .scheme-container { background: #f8fafc; padding: 16px; border-radius: 8px; }
    `,
    customSiteTitle: 'Waka Charge API Docs',
    swaggerOptions: {
      persistAuthorization: true,
      displayRequestDuration: true,
      docExpansion: 'none',
      filter: true,
      tryItOutEnabled: true
    }
  })
)

app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    status: 'ok',
    message: '⚡ Waka Charge API is running',
    version: '1.0.0',
    environment: process.env.NODE_ENV,
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    docs: '/api-docs'
  })
})


app.use(timeout(25000))

// ─── 3. RATE LIMITERS ───────────────────────────────────────────────
// Apply general limit to all API endpoints
app.use('/api/', rateLimits.general)

// Specific targeted rate limit rules
app.use('/api/v1/auth/send-otp', rateLimits.otp)
app.use('/api/v1/auth/resend-otp', rateLimits.otp)
app.use('/api/v1/auth/login', rateLimits.auth)
app.use('/api/v1/auth/operator/login', rateLimits.auth)
app.use('/api/v1/auth/admin/login', rateLimits.auth)
app.use('/api/v1/payments/checkout', rateLimits.checkout)
app.use('/api/v1/payments/', rateLimits.payment)
app.use('/api/v1/rentals', rateLimits.rental)

// ─── 4. MOUNT APPLICATION ROUTERS ───────────────────────────────────
app.use('/api/v1/auth', authRoutes)
app.use('/api/v1/stations', stationRoutes)
app.use('/api/v1/devices', deviceRoutes)
app.use('/api/v1/rentals', rentalRoutes)
app.use('/api/v1/payments', paymentRoutes)
app.use('/api/v1/operator', operatorRoutes)
app.use('/api/v1/admin', adminRoutes)
app.use('/api/v1/notifications', notificationRoutes)
app.use('/api/v1/trust/score', trustScoreRoutes)

// ─── 5. FALLBACKS & ERROR HANDLING ──────────────────────────────────
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`,
    docs: `${req.protocol}://${req.get('host')}/api-docs`
  })
})

app.use(errorHandler)



module.exports = app


// require('dotenv').config()
// require('express-async-errors')

// const express = require('express')
// const cors = require('cors')
// const swaggerUi = require('swagger-ui-express')
// const swaggerSpec = require('./config/swagger')
// const connectDB = require('./config/db')
// const errorHandler = require('./middleware/error.middleware')
// const helmet = require('helmet')
// const compression = require('compression')
// const {
//   startOverdueJob
// } = require('./jobs/overdue.job')

// const app = express()

// const authRoutes = require('./routes/auth.routes')
// const stationRoutes = require('./routes/station.routes')
// const deviceRoutes = require('./routes/device.routes')
// const rentalRoutes = require('./routes/rental.routes')
// const paymentRoutes = require('./routes/payment.routes')
// const operatorRoutes = require('./routes/operator.routes')
// const adminRoutes = require('./routes/admin.routes')
// const notificationRoutes = require('./routes/notification.routes')
// const trustScoreRoutes = require('./routes/trustscore.routes')
// const {
//   apiLimiter,
//   otpLimiter,
//   paymentLimiter
// } = require('./middleware/ratelimit.middleware')


// // Start after DB connects
// connectDB().then(() => {
//   startOverdueJob()
// })

// app.use(cors({
//   origin: '*',
//   methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
//   allowedHeaders: ['Content-Type', 'Authorization', 'x-nomba-signature'],
//   credentials: false
// }))

// app.options('*', cors())

// app.use(helmet())
// app.use(compression())

// // In app.js
// app.use((req, res, next) => {
//   res.setHeader('X-API-Version', '1.0.0')
//   res.setHeader('X-Powered-By', 'Waka Charge')
//   next()
// })

// app.use(express.json())
// app.use(express.urlencoded({ extended: true }))

// app.use(
//   '/api-docs',
//   swaggerUi.serve,
//   swaggerUi.setup(swaggerSpec, {
//     customCss: `
//       .swagger-ui .topbar {
//         background-color: #0D1B2A;
//       }
//       .swagger-ui .topbar-wrapper::after {
//         content: '⚡ Waka Charge API';
//         color: #f59e0b;
//         font-size: 18px;
//         font-weight: bold;
//         padding-left: 20px;
//       }
//       .swagger-ui .topbar-wrapper img { display: none; }
//       .swagger-ui .info .title { color: #0D1B2A; }
//       .swagger-ui .scheme-container { background: #f8fafc; padding: 16px; border-radius: 8px; }
//     `,
//     customSiteTitle: 'Waka Charge API Docs',
//     swaggerOptions: {
//       persistAuthorization: true,
//       displayRequestDuration: true,
//       docExpansion: 'none',
//       filter: true,
//       tryItOutEnabled: true
//     }
//   })
// )

// app.get('/health', (req, res) => {
//   res.status(200).json({
//     success: true,
//     message: '⚡ Waka Charge API is running',
//     version: '1.0.0',
//     environment: process.env.NODE_ENV,
//     timestamp: new Date().toISOString(),
//     docs: '/api-docs'
//   })
// })

// app.use('/api/', apiLimiter)
// app.use('/api/v1/auth/send-otp', otpLimiter)
// app.use('/api/v1/auth/resend-otp', otpLimiter)
// app.use('/api/v1/payments/checkout', paymentLimiter)
// app.use('/api/v1/auth', authRoutes)
// app.use('/api/v1/stations', stationRoutes)
// app.use('/api/v1/devices', deviceRoutes)
// app.use('/api/v1/rentals', rentalRoutes)
// app.use('/api/v1/payments', paymentRoutes)
// app.use('/api/v1/operator', operatorRoutes)
// app.use('/api/v1/admin', adminRoutes)
// app.use('/api/v1/notifications', notificationRoutes)
// app.use('/api/v1/trust', trustScoreRoutes)

// app.use('*', (req, res) => {
//   res.status(404).json({
//     success: false,
//     message: `Route ${req.originalUrl} not found`,
//     docs: `${req.protocol}://${req.get('host')}/api-docs`
//   })
// })

// app.use(errorHandler)

// const PORT = process.env.PORT || 5000

// app.listen(PORT, () => {
//   console.log(`
// ╔══════════════════════════════════════╗
// ║      ⚡ WAKA CHARGE BACKEND          ║
// ╠══════════════════════════════════════╣
// ║  Status : Running ✅                 ║
// ║  Port   : ${String(PORT).padEnd(26)}║
// ║  Docs   : /api-docs                  ║
// ║  Health : /health                    ║
// ╚══════════════════════════════════════╝
//   `)
// })

// module.exports = app