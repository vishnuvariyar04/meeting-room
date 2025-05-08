import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import Room from '@/models/Room'
import Booking from '@/models/Booking'
import connectDB from '@/lib/mongodb'

export async function POST(req) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { date, timeSlots } = await req.json()

    if (!date || !timeSlots || !Array.isArray(timeSlots) || timeSlots.length === 0) {
      return NextResponse.json({ error: 'Date and time slots are required' }, { status: 400 })
    }

    await connectDB()

    // Get all rooms
    const rooms = await Room.find({})
    if (!rooms.length) {
      return NextResponse.json({ error: 'No rooms found' }, { status: 404 })
    }

    // Get all approved bookings for the selected date
    const bookings = await Booking.find({
      date,
      status: 'approved'
    }).populate('room')

    // Create a map of room IDs to their bookings
    const roomBookings = new Map()
    bookings.forEach(booking => {
      const roomId = booking.room._id.toString()
      if (!roomBookings.has(roomId)) {
        roomBookings.set(roomId, [])
      }
      roomBookings.get(roomId).push({
        startTime: booking.startTime,
        endTime: booking.endTime
      })
    })

    // Helper function to convert time string to minutes
    const timeToMinutes = (timeStr) => {
      const [hours, minutes] = timeStr.split(':').map(Number)
      return hours * 60 + minutes
    }

    // Helper function to convert minutes back to time format
    const minutesToTime = (minutes) => {
      const hours = Math.floor(minutes / 60).toString().padStart(2, '0')
      const mins = (minutes % 60).toString().padStart(2, '0')
      return `${hours}:${mins}`
    }

    // Simplified helper function to check if two time ranges overlap
    const doRangesOverlap = (range1, range2) => {
      const range1Start = timeToMinutes(range1.startTime)
      const range1End = timeToMinutes(range1.endTime)
      const range2Start = timeToMinutes(range2.startTime)
      const range2End = timeToMinutes(range2.endTime)
      
      // The simplest overlap check: two ranges don't overlap only if one ends before or at the other starts
      return !(range1End <= range2Start || range1Start >= range2End)
    }

    // Calculate the combined time range from all requested time slots
    // This treats multiple slots as one continuous booking from earliest to latest
    const calculateCombinedTimeRange = (slots) => {
      if (!slots || slots.length === 0) return null
      
      // Find the earliest start time and latest end time
      let earliestStartMinutes = Number.MAX_SAFE_INTEGER
      let latestEndMinutes = 0
      
      slots.forEach(slot => {
        const startMinutes = timeToMinutes(slot.startTime)
        const endMinutes = timeToMinutes(slot.endTime)
        
        earliestStartMinutes = Math.min(earliestStartMinutes, startMinutes)
        latestEndMinutes = Math.max(latestEndMinutes, endMinutes)
      })
      
      return {
        startTime: minutesToTime(earliestStartMinutes),
        endTime: minutesToTime(latestEndMinutes)
      }
    }

    // Get the combined time range for all requested slots
    const combinedRequestedRange = calculateCombinedTimeRange(timeSlots)
    console.log("Combined requested range:", combinedRequestedRange)

    // Return all rooms with their availability status
    const roomsWithStatus = rooms.map(room => {
      const roomId = room._id.toString()
      const bookedRanges = roomBookings.get(roomId) || []
      
      console.log(`Room ${roomId} - Booked slots:`, bookedRanges)
      
      // Check if the combined time range overlaps with any booked range
      const isAvailable = !bookedRanges.some(bookedSlot => {
        const overlaps = doRangesOverlap(combinedRequestedRange, bookedSlot)
        if (overlaps) {
          console.log(`Conflict detected - Requested range: ${combinedRequestedRange.startTime}-${combinedRequestedRange.endTime}, Booked: ${bookedSlot.startTime}-${bookedSlot.endTime}`)
        }
        return overlaps
      })

      return {
        ...room.toObject(),
        isAvailable
      }
    })

    return NextResponse.json(roomsWithStatus)
  } catch (error) {
    console.error('Error fetching available rooms:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}