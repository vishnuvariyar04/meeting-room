import mongoose from 'mongoose'

const roomSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
  },
  capacity: {
    type: Number,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  amenities: [{
    type: String,
    required: true,
  }],
  images: [{
    type: String,
    required: true,
  }],
  availableTimeSlots: [
    {
      startTime: {
        type: String,
        required: true,
      },
      endTime: {
        type: String,
        required: true,
      },
    },
  ],
  createdAt: {
    type: Date,
    default: Date.now,
  },
})

const Room = mongoose.models.Room || mongoose.model('Room', roomSchema)

export default Room 