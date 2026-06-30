require('dotenv').config()
require('express-async-errors')

const express = require('express')
const cors = require('cors')
const swaggerUi = require('swagger-ui-express')
const swaggerSpec = require('./config/swagger')
const connectDB = require('./config/db')
const errorHandler = require('./middleware/error.middleware')
const Transaction = require('./models/Transaction')

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

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-nomba-signature'],
  credentials: false
}))

app.options('*', cors())

app.use(express.json())
app.use(express.urlencoded({ extended: true }))

app.use(
  '/api-docs',
  swaggerUi.serve,
  swaggerUi.setup(swaggerSpec, {
    customCss: `
      .swagger-ui .topbar {
        background-color: #0D1B2A;
      }
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
    message: '⚡ Waka Charge API is running',
    version: '1.0.0',
    environment: process.env.NODE_ENV,
    timestamp: new Date().toISOString(),
    docs: '/api-docs'
  })
})

// ─── Temporary payment verification landing page (until frontend exists) ─────

/**
 * @swagger
 * /payment/verify:
 *   get:
 *     summary: Temporary payment verification landing page (until frontend exists)
 *     tags: [Payments]
 *     description: |
 *       This is a placeholder page until the Waka Charge frontend is built.
 *       Nomba checkout's callbackUrl redirects here after payment.
 *       It does NOT credit the wallet automatically — call
 *       GET /api/v1/payments/verify/:reference with a Bearer token to confirm.
 *     parameters:
 *       - in: query
 *         name: reference
 *         schema:
 *           type: string
 *       - in: query
 *         name: orderReference
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: HTML landing page showing payment reference and status
 */
app.get('/payment/verify', async (req, res) => {
  const { reference, orderReference } = req.query
  const ref = reference || orderReference

  if (!ref) {
    return res.status(400).send('Missing payment reference')
  }

  try {
    const transaction = await Transaction.findOne({ reference: ref })

    res.send(`
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Payment Status — Waka Charge</title>
      </head>
      <body style="margin:0;padding:0;background:#f0f2f5;font-family:'Segoe UI',Arial,sans-serif;">
        <div style="max-width:480px;margin:60px auto;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.08);">
          <div style="background:linear-gradient(135deg,#1a1a2e,#0f3460);padding:32px;text-align:center;">
            <h1 style="margin:0;color:#ffffff;font-size:24px;">⚡ Waka<span style="color:#f59e0b;">Charge</span></h1>
          </div>
          <div style="padding:32px;text-align:center;">
            <p style="color:#64748b;font-size:13px;text-transform:uppercase;letter-spacing:1px;margin:0 0 8px;">Reference</p>
            <p style="color:#1e293b;font-size:14px;font-weight:600;margin:0 0 24px;word-break:break-all;">${ref}</p>

            <p style="color:#64748b;font-size:13px;text-transform:uppercase;letter-spacing:1px;margin:0 0 8px;">Status</p>
            <p style="font-size:20px;font-weight:700;margin:0 0 24px;color:${
              transaction?.status === 'success' ? '#16a34a' :
              transaction?.status === 'pending' ? '#d97706' : '#dc2626'
            };">
              ${transaction?.status?.toUpperCase() || 'UNKNOWN'}
            </p>

            <div style="background:#f8fafc;border-radius:10px;padding:16px;text-align:left;font-size:13px;color:#475569;">
              To confirm this payment and credit your wallet, call:
              <pre style="background:#1a1a2e;color:#f59e0b;padding:12px;border-radius:8px;overflow-x:auto;margin:8px 0 0;">GET /api/v1/payments/verify/${ref}</pre>
              with your Bearer token in the Authorization header.
            </div>
          </div>
        </div>
      </body>
      </html>
    `)
  } catch (error) {
    res.status(500).send('Error checking payment status')
  }
})

app.use('/api/v1/auth', authRoutes)
app.use('/api/v1/stations', stationRoutes)
app.use('/api/v1/devices', deviceRoutes)
app.use('/api/v1/rentals', rentalRoutes)
app.use('/api/v1/payments', paymentRoutes)
app.use('/api/v1/operator', operatorRoutes)
app.use('/api/v1/admin', adminRoutes)
app.use('/api/v1/notifications', notificationRoutes)
app.use('/api/v1/trust', trustScoreRoutes)

app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`,
    docs: `${req.protocol}://${req.get('host')}/api-docs`
  })
})

app.use(errorHandler)

const PORT = process.env.PORT || 5000

app.listen(PORT, () => {
  console.log(`
╔══════════════════════════════════════╗
║      ⚡ WAKA CHARGE BACKEND          ║
╠══════════════════════════════════════╣
║  Status : Running ✅                 ║
║  Port   : ${String(PORT).padEnd(26)}║
║  Docs   : /api-docs                  ║
║  Health : /health                    ║
╚══════════════════════════════════════╝
  `)
})

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