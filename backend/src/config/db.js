const mongoose = require('mongoose')

const connectDB = async () => {
  const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/wakacharge'

  try {
    // Ensure the connection string explicitly disables retryable writes for
    // standalone MongoDB deployments. If the user already provided
    // `retryWrites` in the URI, leave it unchanged.
    let finalUri = mongoUri
    if (!/retryWrites\s*=/i.test(mongoUri)) {
      finalUri = mongoUri.includes('?') ? `${mongoUri}&retryWrites=false` : `${mongoUri}?retryWrites=false`
      console.log('MongoDB: appended retryWrites=false to connection string')
    }

    const conn = await mongoose.connect(finalUri)
    console.log(`MongoDB Connected: ${conn.connection.host}`)
  } catch (error) {
    console.error(`MongoDB Connection Error: ${error.message}`)
    console.error('Set MONGODB_URI in your .env file or ensure MongoDB is running locally.')
    process.exit(1)
  }
}

module.exports = connectDB
