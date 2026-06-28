require('dotenv').config()
require('express-async-errors')

const express = require('express')
const cors = require('cors')
const swaggerUi = require('swagger-ui-express')
const swaggerSpec = require('./config/swagger')
const connectDB = require('./config/db')
const errorHandler = require('./middleware/error.middleware')

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
  origin: process.env.FRONTEND_URL || '*',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: [
    'Content-Type', 'Authorization', 'x-nomba-signature'
  ]
}))

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
        color: #1DB954;
        font-size: 18px;
        font-weight: bold;
        padding-left: 20px;
      }
      .swagger-ui .topbar-wrapper img { display: none; }
    `,
    customSiteTitle: 'Waka Charge API Docs',
    swaggerOptions: { persistAuthorization: true }
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