import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import Room from '@/models/Room'
import connectDB from '@/lib/mongodb'

export async function GET(req) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    await connectDB()
    const rooms = await Room.find()
    return NextResponse.json(rooms)
  } catch (error) {
    console.error('Error fetching rooms:', error)
    return NextResponse.json(
      { message: 'Error fetching rooms' },
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

    if (session.user.role !== 'admin') {
      return NextResponse.json(
        { message: 'Only admins can create rooms' },
        { status: 403 }
      )
    }

    const body = await req.json()
    const { name, description, capacity, amenities, availableTimeSlots } = body

    if (!name || !description || !capacity || !amenities || !availableTimeSlots) {
      return NextResponse.json(
        { message: 'All fields are required' },
        { status: 400 }
      )
    }

    await connectDB()

    const room = await Room.create({
      name,
      description,
      capacity,
      amenities,
      availableTimeSlots
    })

    return NextResponse.json(room)
  } catch (error) {
    console.error('Error creating room:', error)
    return NextResponse.json(
      { message: 'Error creating room' },
      { status: 500 }
    )
  }
} 