import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import Booking from '@/models/Booking'
import connectDB from '@/lib/mongodb'

export async function POST() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      )
    }

    await connectDB()

    // Get current date and time
    const now = new Date()
    const currentDate = now.toISOString().split('T')[0]
    const currentTime = now.toTimeString().split(' ')[0].slice(0, 5)

    // Find all approved bookings that are past their end time
    const completedBookings = await Booking.find({
      status: 'approved',
      $or: [
        // Bookings from previous dates
        { date: { $lt: currentDate } },
        // Bookings from today that have ended
        {
          date: currentDate,
          endTime: { $lte: currentTime }
        }
      ]
    }).populate('room')

    // Update status to 'completed' for all found bookings
    if (completedBookings.length > 0) {
      const updateResult = await Booking.updateMany(
        { _id: { $in: completedBookings.map(booking => booking._id) } },
        { $set: { status: 'completed' } }
      )

      console.log(`Updated ${updateResult.modifiedCount} bookings to completed status`)
    }

    return NextResponse.json({
      message: 'Booking statuses updated successfully',
      updatedCount: completedBookings.length,
      currentDate,
      currentTime
    })
  } catch (error) {
    console.error('Error updating booking statuses:', error)
    return NextResponse.json(
      { message: 'Error updating booking statuses', error: error.message },
      { status: 500 }
    )
  }
} 