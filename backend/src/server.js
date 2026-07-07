// src/server.js
require('dotenv').config()

const cluster = require('cluster')
const os = require('os')

// ── Cluster mode: use 2 workers max on free tier ──────────
const WORKERS = process.env.NODE_ENV === 'production'
  ? Math.min(os.cpus().length, 2)
  : 1

if (cluster.isPrimary && process.env.NODE_ENV === 'production') {
  console.log(`\n🚀 Primary ${process.pid} starting ${WORKERS} workers`)

  for (let i = 0; i < WORKERS; i++) {
    cluster.fork()
  }

  cluster.on('exit', (worker, code, signal) => {
    console.log(`⚠️  Worker ${worker.process.pid} died — spawning replacement`)
    cluster.fork()
  })

  cluster.on('online', (worker) => {
    console.log(`✅ Worker ${worker.process.pid} online`)
  })

} else {
  // ── Single process in dev, worker process in production ──
  startServer()
}

async function startServer() {
  try {
    // 1. Connect to MongoDB with optimized pool
    const mongoose = require('mongoose')

    const poolConfig = {
      maxPoolSize: 10,
      minPoolSize: 2
    }

    await mongoose.connect(process.env.MONGO_URI, {
      ...poolConfig,
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
      connectTimeoutMS: 10000,
      heartbeatFrequencyMS: 10000,
    })

    console.log(`✅ MongoDB connected: ${mongoose.connection.host}`)
    console.log(`📊 Pool: ${poolConfig.maxPoolSize} connections`)

    // 2. Import your existing app.js (all routes, middleware, compression already defined there)
    const app = require('./app')
    const http = require('http')

    // 3. Create indexes in background (non-blocking)
    createIndexes(mongoose).catch(err => {
      console.warn('⚠️  Index creation warning:', err.message)
    })

    // 4. Start listening
    const PORT = process.env.PORT || 5000
    const server = http.createServer(app)

    server.listen(PORT, () => {
      console.log(`
╔════════════════════════════════════════╗
║       ⚡ WAKA CHARGE BACKEND           ║
╠════════════════════════════════════════╣
║  Status      : Running ✅              ║
║  Environment : ${(process.env.NODE_ENV || 'development').padEnd(22)}║
║  Port        : ${String(PORT).padEnd(22)}║
║  PID         : ${String(process.pid).padEnd(22)}║
║  API Docs    : /api-docs              ║
║  Health      : /health                ║
╚════════════════════════════════════════╝
      `)

      // 5. Start keep-alive pinger in production
      if (process.env.NODE_ENV === 'production') {
        startKeepAlive()
      }
    })

    // 6. Graceful shutdown
    const shutdown = async (signal) => {
      console.log(`\n📴 ${signal} received — shutting down gracefully`)
      server.close(async () => {
        await mongoose.connection.close()
        console.log('✅ Server closed cleanly')
        process.exit(0)
      })

      // Force exit after 10 seconds
      setTimeout(() => {
        console.error('❌ Forced exit after timeout')
        process.exit(1)
      }, 10000)
    }

    process.on('SIGTERM', () => shutdown('SIGTERM'))
    process.on('SIGINT', () => shutdown('SIGINT'))

    // 7. Handle unhandled errors — don't crash the server
    process.on('unhandledRejection', (reason, promise) => {
      console.error('❌ Unhandled Rejection:', reason)
      // Don't exit — just log it
    })

    process.on('uncaughtException', (err) => {
      console.error('❌ Uncaught Exception:', err)
      // Restart worker
      process.exit(1)
    })

  } catch (err) {
    console.error('❌ Server startup failed:', err.message)
    process.exit(1)
  }
}

// ── Keep-alive pinger ─────────────────────────────────────
function startKeepAlive() {
  const url = process.env.BACKEND_URL || 'https://wakacharge.onrender.com'

  setInterval(async () => {
    try {
      const res = await fetch(`${url}/health`)
      const data = await res.json()
      console.log(`[KeepAlive] ✅ ${new Date().toISOString()} — ${data.status || data.message}`)
    } catch (err) {
      console.log(`[KeepAlive] ⚠️  Ping failed: ${err.message}`)
    }
  }, 14 * 60 * 1000) // Every 14 minutes

  console.log('[KeepAlive] Pinger started — server will not sleep')
}

// ── Create MongoDB indexes ────────────────────────────────
async function createIndexes(mongoose) {
  const db = mongoose.connection.db
  if (!db) return

  try {
    // Users
    await db.collection('users').createIndexes([
      { key: { email: 1 }, unique: true, name: 'email_unique', background: true },
      { key: { campus: 1, role: 1 }, name: 'campus_role', background: true },
      { key: { role: 1, isActive: 1 }, name: 'role_active', background: true },
      { key: { virtualAccountNumber: 1 }, name: 'virtual_account', background: true },
    ])

    // Rentals
    await db.collection('rentals').createIndexes([
      { key: { userId: 1, status: 1 }, name: 'user_status', background: true },
      { key: { stationId: 1, status: 1 }, name: 'station_status', background: true },
      { key: { status: 1, expectedReturnTime: 1 }, name: 'status_return', background: true },
      { key: { confirmationCode: 1 }, name: 'confirmation_code', background: true },
    ])

    // Transactions
    await db.collection('transactions').createIndexes([
      { key: { userId: 1, createdAt: -1 }, name: 'user_created', background: true },
      { key: { reference: 1 }, unique: true, name: 'reference_unique', background: true },
      { key: { status: 1, type: 1 }, name: 'status_type', background: true },
    ])

    // Stations
    await db.collection('stations').createIndexes([
      { key: { campus: 1, isActive: 1 }, name: 'campus_active', background: true },
    ])

    // Devices
    await db.collection('devices').createIndexes([
      { key: { stationId: 1, deviceType: 1, status: 1 }, name: 'station_type_status', background: true },
      { key: { deviceCode: 1 }, unique: true, name: 'device_code_unique', background: true },
    ])

    // Notifications — auto-delete after 30 days
    await db.collection('notifications').createIndexes([
      { key: { userId: 1, isRead: 1, createdAt: -1 }, name: 'user_read_created', background: true },
      { key: { createdAt: 1 }, name: 'ttl_notifications', expireAfterSeconds: 30 * 24 * 3600, background: true },
    ])

    // OTPs — auto-delete after 10 minutes
    await db.collection('otps').createIndexes([
      { key: { email: 1, type: 1 }, name: 'email_type', background: true },
      { key: { createdAt: 1 }, name: 'ttl_otps', expireAfterSeconds: 600, background: true },
    ])

    console.log('📇 MongoDB indexes ready')
  } catch (err) {
    // Indexes may already exist — that's fine
    if (!err.message?.includes('already exists')) {
      console.warn('⚠️  Index warning:', err.message)
    }
  }
}