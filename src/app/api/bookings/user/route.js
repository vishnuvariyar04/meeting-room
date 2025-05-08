import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import connectDB from '@/lib/mongodb'
import Booking from '@/models/Booking'

export async function GET() {
  try {
    const session = await getServerSession()
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    await connectDB()

    const bookings = await Booking.find({ user: session.user.id })
      .populate('room')
      .sort({ date: -1, startTime: 1 })

    return NextResponse.json(bookings)
  } catch (error) {
    return NextResponse.json(
      { error: 'Error fetching user bookings' },
      { status: 500 }
    )
  }
} 