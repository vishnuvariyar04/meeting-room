import mongoose from 'mongoose'

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  role: {
    type: String,
    enum: ['admin', 'incubated', 'external'],
    default: 'external',
  },
  startupName: {
    type: String,
    required: true,
  },
  resetToken: String,
  resetTokenExpiry: Date,
  createdAt: {
    type: Date,
    default: Date.now,
  },
}, {
  timestamps: true,
})

const User = mongoose.models.User || mongoose.model('User', userSchema)

export default User 