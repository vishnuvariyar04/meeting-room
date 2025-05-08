import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import Room from '@/models/Room'
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

    if (session.user.role !== 'admin') {
      return NextResponse.json(
        { message: 'Only admin can update rooms' },
        { status: 403 }
      )
    }

    await connectDB()
    const { id } = params
    const roomData = await req.json()

    // Check if room exists
    const room = await Room.findById(id)
    if (!room) {
      return NextResponse.json(
        { message: 'Room not found' },
        { status: 404 }
      )
    }

    // Check for name conflict if name is being changed
    if (roomData.name && roomData.name !== room.name) {
      const existingRoom = await Room.findOne({ name: roomData.name })
      if (existingRoom) {
        return NextResponse.json(
          { message: 'Room with this name already exists' },
          { status: 400 }
        )
      }
    }

    // Update room
    const updatedRoom = await Room.findByIdAndUpdate(
      id,
      { $set: roomData },
      { new: true }
    )

    return NextResponse.json(updatedRoom)
  } catch (error) {
    console.error('Error updating room:', error)
    return NextResponse.json(
      { message: 'Error updating room' },
      { status: 500 }
    )
  }
}

export async function DELETE(req, { params }) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      )
    }

    if (session.user.role !== 'admin') {
      return NextResponse.json(
        { message: 'Only admin can delete rooms' },
        { status: 403 }
      )
    }

    await connectDB()
    const { id } = params

    // Check if room exists
    const room = await Room.findById(id)
    if (!room) {
      return NextResponse.json(
        { message: 'Room not found' },
        { status: 404 }
      )
    }

    // Check if room has any active bookings
    const activeBookings = await Booking.find({
      room: id,
      status: { $in: ['pending', 'approved'] }
    })

    if (activeBookings.length > 0) {
      return NextResponse.json(
        { message: 'Cannot delete room with active bookings' },
        { status: 400 }
      )
    }

    // Delete room
    await Room.findByIdAndDelete(id)

    return NextResponse.json(
      { message: 'Room deleted successfully' },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error deleting room:', error)
    return NextResponse.json(
      { message: 'Error deleting room' },
      { status: 500 }
    )
  }
} 