import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import Booking from '@/models/Booking'
import Room from '@/models/Room'
import connectDB from '@/lib/mongodb'

export async function GET(req) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    await connectDB()

    let bookings
    if (session.user.role === 'admin') {
      // Admin can see all bookings
      bookings = await Booking.find({})
        .populate('room')
        .populate('user', 'name email startupName role')
        .sort({ date: -1, startTime: -1 })
    } else {
      // Regular users can only see their bookings
      bookings = await Booking.find({ user: session.user.id })
        .populate('room')
        .sort({ date: -1, startTime: -1 })
    }

    return NextResponse.json(bookings)
  } catch (error) {
    console.error('Error fetching bookings:', error)
    return NextResponse.json(
      { message: 'Error fetching bookings' },
      { status: 500 }
    )
  }
}

export async function POST(req) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const { roomId, date, timeSlots, purpose } = await req.json()
    if (!roomId || !date || !timeSlots || !Array.isArray(timeSlots) || timeSlots.length === 0) {
      return NextResponse.json(
        { message: 'Missing required fields' },
        { status: 400 }
      )
    }

    await connectDB()

    // Check if room exists
    const room = await Room.findById(roomId)
    if (!room) {
      return NextResponse.json(
        { message: 'Room not found' },
        { status: 404 }
      )
    }

    // Sort time slots
    const sortedTimeSlots = [...timeSlots].sort((a, b) => 
      a.startTime.localeCompare(b.startTime)
    )

    // Get start and end times
    const startTime = sortedTimeSlots[0].startTime
    const endTime = sortedTimeSlots[sortedTimeSlots.length - 1].endTime

    // Check for overlapping bookings
    const overlappingBookings = await Booking.find({
      room: roomId,
      date,
      status: { $in: ['pending', 'approved'] },
      $or: [
        {
          startTime: { $lte: startTime },
          endTime: { $gt: startTime }
        },
        {
          startTime: { $lt: endTime },
          endTime: { $gte: endTime }
        }
      ]
    })

    if (overlappingBookings.length > 0) {
      return NextResponse.json(
        { message: 'Room is already booked for some of the selected time slots' },
        { status: 400 }
      )
    }

    // Set initial status based on user role
    const initialStatus = session.user.role === 'incubated' ? 'approved' : 'pending'

    // Create booking
    const booking = await Booking.create({
      user: session.user.id,
      room: roomId,
      date,
      startTime,
      endTime,
      timeSlots: sortedTimeSlots,
      purpose,
      status: initialStatus
    })

    // Populate the booking with room and user details
    const populatedBooking = await Booking.findById(booking._id)
      .populate('room')
      .populate('user', 'name email startupName role')

    return NextResponse.json(populatedBooking)
  } catch (error) {
    console.error('Error creating booking:', error)
    return NextResponse.json(
      { message: 'Error creating booking' },
      { status: 500 }
    )
  }
} 