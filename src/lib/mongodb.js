import mongoose from 'mongoose'

const MONGODB_URI = process.env.MONGODB_URI

if (!MONGODB_URI) {
  throw new Error('Please define the MONGODB_URI environment variable inside .env.local')
}

let cached = global.mongoose

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null }
}

async function connectDB() {
  if (cached.conn) {
    console.log('Using cached MongoDB connection')
    return cached.conn
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      family: 4,
      maxPoolSize: 10,
      minPoolSize: 5,
      connectTimeoutMS: 10000,
      retryWrites: true,
      retryReads: true
    }

    console.log('Connecting to MongoDB...')
    cached.promise = mongoose.connect(MONGODB_URI, opts)
      .then((mongoose) => {
        console.log('MongoDB connected successfully')
        return mongoose
      })
      .catch((error) => {
        console.error('MongoDB connection error:', error)
        cached.promise = null
        throw error
      })
  }

  try {
    cached.conn = await cached.promise
  } catch (e) {
    cached.promise = null
    console.error('Error in MongoDB connection:', e)
    throw e
  }

  return cached.conn
}

mongoose.connection.on('error', (err) => {
  console.error('MongoDB connection error:', err)
  cached.promise = null
  cached.conn = null
})

mongoose.connection.on('disconnected', () => {
  console.log('MongoDB disconnected')
  cached.promise = null
  cached.conn = null
})

mongoose.connection.on('reconnected', () => {
  console.log('MongoDB reconnected')
})

export default connectDB 