// src/config/db.js — complete rewrite

const mongoose = require('mongoose')

const connectDB = async () => {
  try {
    // Connection pool configuration
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      // Pool size — how many connections to keep open
      maxPoolSize: 10,        // Max 10 simultaneous connections (safe for M0's 100 limit)
      minPoolSize: 2,         // Keep 2 warm connections always ready
      
      // Timeouts
      serverSelectionTimeoutMS: 10000,  // 10s to find server
      socketTimeoutMS: 45000,           // 45s socket timeout
      connectTimeoutMS: 10000,          // 10s to establish connection
      
      // Heartbeat — detect dead connections
      heartbeatFrequencyMS: 10000,
      
      // Compression — reduces bandwidth to Atlas
      compressors: ['zlib'],
      
      // Write concern — faster writes (slightly less durable, fine for this use case)
      w: 'majority',
      wtimeoutMS: 5000,
      
      // Read preference — can read from secondaries for non-critical data
      readPreference: 'primaryPreferred',
    })

    console.log(`✅ MongoDB connected: ${conn.connection.host}`)
    console.log(`📊 Pool size: ${conn.connection.config.maxPoolSize}`)

    // Monitor connection events
    mongoose.connection.on('disconnected', () => {
      console.log('⚠️ MongoDB disconnected — attempting reconnect')
    })

    mongoose.connection.on('reconnected', () => {
      console.log('✅ MongoDB reconnected')
    })

    mongoose.connection.on('error', (err) => {
      console.error('❌ MongoDB error:', err)
    })

    // Graceful shutdown — close pool properly
    process.on('SIGINT', async () => {
      await mongoose.connection.close()
      console.log('MongoDB connection closed on app termination')
      process.exit(0)
    })

  } catch (error) {
    console.error('❌ MongoDB connection failed:', error.message)
    process.exit(1)
  }
}

module.exports = connectDB