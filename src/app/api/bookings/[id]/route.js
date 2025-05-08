import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import Booking from '@/models/Booking'
import connectDB from '@/lib/mongodb'

export async function PATCH(req, { params }) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Only admin can approve/reject bookings
    if (session.user.role !== 'admin') {
      return NextResponse.json(
        { message: 'Only admin can approve/reject bookings' },
        { status: 403 }
      )
    }

    await connectDB()
    const { id } = params
    const { status } = await req.json()

    if (!['approved', 'rejected'].includes(status)) {
      return NextResponse.json(
        { message: 'Invalid status' },
        { status: 400 }
      )
    }

    const booking = await Booking.findById(id)
    if (!booking) {
      return NextResponse.json(
        { message: 'Booking not found' },
        { status: 404 }
      )
    }

    booking.status = status
    await booking.save()

    // Populate the booking with room and user details
    const updatedBooking = await Booking.findById(id)
      .populate('room', 'name capacity')
      .populate('user', 'name email startupName')

    return NextResponse.json(updatedBooking)
  } catch (error) {
    console.error('Error updating booking:', error)
    return NextResponse.json(
      { message: 'Error updating booking' },
      { status: 500 }
    )
  }
}

export async function DELETE(request, { params }) {
  try {
    const session = await getServerSession()
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { id } = params
    await connectDB()

    const booking = await Booking.findById(id)
    if (!booking) {
      return NextResponse.json(
        { error: 'Booking not found' },
        { status: 404 }
      )
    }

    // Only allow users to delete their own bookings or admins to delete any booking
    if (
      session.user.role !== 'admin' &&
      booking.user.toString() !== session.user.id
    ) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    await booking.deleteOne()
    return NextResponse.json({ message: 'Booking deleted successfully' })
  } catch (error) {
    return NextResponse.json(
      { error: 'Error deleting booking' },
      { status: 500 }
    )
  }
} 