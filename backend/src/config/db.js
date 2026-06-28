const mongoose = require('mongoose')

const connectDB = async () => {
  const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/wakacharge'

  try {
    const conn = await mongoose.connect(mongoUri)
    console.log(`MongoDB Connected: ${conn.connection.host}`)
  } catch (error) {
    console.error(`MongoDB Connection Error: ${error.message}`)
    console.error('Set MONGODB_URI in your .env file or ensure MongoDB is running locally.')
    process.exit(1)
  }
}

module.exports = connectDB
