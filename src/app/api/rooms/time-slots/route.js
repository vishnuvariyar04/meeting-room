import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import Room from '@/models/Room'
import Booking from '@/models/Booking'
import connectDB from '@/lib/mongodb'

// Generate all possible time slots from 9 AM to 6 PM
const generateAllTimeSlots = () => {
  const slots = []
  for (let hour = 9; hour < 18; hour++) {
    slots.push({
      startTime: `${hour.toString().padStart(2, '0')}:00`,
      endTime: `${hour.toString().padStart(2, '0')}:30`
    })
    if (hour < 17) {
      slots.push({
        startTime: `${hour.toString().padStart(2, '0')}:30`,
        endTime: `${(hour + 1).toString().padStart(2, '0')}:00`
      })
    }
  }
  return slots
}

export async function POST(req) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const { roomId, date } = await req.json()
    if (!roomId || !date) {
      return NextResponse.json(
        { message: 'Room ID and date are required' },
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

    // Get all possible time slots
    const allTimeSlots = generateAllTimeSlots()

    // Get all approved bookings for the room on the selected date
    const bookings = await Booking.find({
      room: roomId,
      date,
      status: 'approved'
    })

    // Create a set of booked time slots
    const bookedTimeSlots = new Set()
    bookings.forEach(booking => {
      // Convert booking time range to individual slots
      const startHour = parseInt(booking.startTime.split(':')[0])
      const startMinute = parseInt(booking.startTime.split(':')[1])
      const endHour = parseInt(booking.endTime.split(':')[0])
      const endMinute = parseInt(booking.endTime.split(':')[1])

      // Add all slots that fall within the booking time range
      allTimeSlots.forEach(slot => {
        const slotStartHour = parseInt(slot.startTime.split(':')[0])
        const slotStartMinute = parseInt(slot.startTime.split(':')[1])
        const slotEndHour = parseInt(slot.endTime.split(':')[0])
        const slotEndMinute = parseInt(slot.endTime.split(':')[1])

        // Check if slot overlaps with booking
        if (
          (slotStartHour > startHour || (slotStartHour === startHour && slotStartMinute >= startMinute)) &&
          (slotEndHour < endHour || (slotEndHour === endHour && slotEndMinute <= endMinute))
        ) {
          bookedTimeSlots.add(`${slot.startTime}-${slot.endTime}`)
        }
      })
    })

    // Return all slots with their availability status
    const timeSlotsWithStatus = allTimeSlots.map(slot => ({
      ...slot,
      isAvailable: !bookedTimeSlots.has(`${slot.startTime}-${slot.endTime}`)
    }))

    return NextResponse.json(timeSlotsWithStatus)
  } catch (error) {
    console.error('Error fetching available time slots:', error)
    return NextResponse.json(
      { message: 'Error fetching available time slots' },
      { status: 500 }
    )
  }
} 