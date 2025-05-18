import mongoose from 'mongoose'

const bookingSchema = new mongoose.Schema({
  room: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Room',
    required: true,
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  date: {
    type: String,
    required: true,
  },
  startTime: {
    type: String,
    required: true,
  },
  endTime: {
    type: String,
    required: true,
  },
  timeSlots: [{
    startTime: String,
    endTime: String
  }],
  purpose: {
    type: String,
    default: '',
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'completed'],
    default: 'pending',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
})

const Booking = mongoose.models.Booking || mongoose.model('Booking', bookingSchema)

export default Booking 