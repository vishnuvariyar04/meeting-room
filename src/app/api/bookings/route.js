import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import Booking from '@/models/Booking'
import Room from '@/models/Room'
import connectDB from '@/lib/mongodb'
import { sendBookingConfirmation, sendAdminNotification, sendApprovalRequest } from '@/lib/email'

// Helper function to calculate hours between two times
const calculateHours = (startTime, endTime) => {
  const [startHour, startMinute] = startTime.split(':').map(Number);
  const [endHour, endMinute] = endTime.split(':').map(Number);
  const startTotalMinutes = startHour * 60 + startMinute;
  const endTotalMinutes = endHour * 60 + endMinute;
  return (endTotalMinutes - startTotalMinutes) / 60;
};

// Helper function to check if room requires admin approval
const requiresAdminApproval = (roomName) => {
  const roomNameLower = roomName.toLowerCase();
  return roomNameLower.includes('auditorium') || 
         roomNameLower.includes('conference room') ||
         roomNameLower.includes('conference');
};

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

    // Calculate hours for the new booking
    const newBookingHours = calculateHours(startTime, endTime);
    console.log('New booking hours:', newBookingHours);

    // Get month range for the booking date
    const bookingDate = new Date(date);
    const firstDayOfMonth = new Date(bookingDate.getFullYear(), bookingDate.getMonth(), 1);
    const lastDayOfMonth = new Date(bookingDate.getFullYear(), bookingDate.getMonth() + 1, 0);

    // Get all approved and pending bookings for the user in the current month
    const monthlyBookings = await Booking.find({
      user: session.user.id,
      date: {
        $gte: firstDayOfMonth.toISOString().split('T')[0],
        $lte: lastDayOfMonth.toISOString().split('T')[0]
      },
      status: { $in: ['approved', 'pending'] }
    });

    console.log('Found monthly bookings:', monthlyBookings.length);

    // Calculate total hours booked this month
    let totalMonthlyHours = 0;
    monthlyBookings.forEach(booking => {
      const bookingHours = calculateHours(booking.startTime, booking.endTime);
      console.log('Booking hours:', bookingHours);
      totalMonthlyHours += bookingHours;
    });

    console.log('Total monthly hours:', totalMonthlyHours);
    console.log('New booking hours:', newBookingHours);
    console.log('Total after new booking:', totalMonthlyHours + newBookingHours);

    // Check if adding new booking would exceed 8 hours
    if (totalMonthlyHours + newBookingHours > 8) {
      return NextResponse.json(
        { message: `You have already booked ${totalMonthlyHours.toFixed(1)} hours this month. Adding this booking of ${newBookingHours.toFixed(1)} hours would exceed the 8-hour limit. Please contact the admin for additional bookings.` },
        { status: 400 }
      )
    }

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

    // Set initial status based on user role and room type
    let initialStatus;
    if (session.user.role === 'incubated') {
      // For incubated users, check if the room requires admin approval
      initialStatus = requiresAdminApproval(room.name) ? 'pending' : 'approved';
    } else {
      // For external users, always require admin approval
      initialStatus = 'pending';
    }

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

    // Prepare booking details for email
    const bookingDetails = {
      roomName: populatedBooking.room.name,
      userName: populatedBooking.user.name,
      date: populatedBooking.date,
      startTime: populatedBooking.startTime,
      endTime: populatedBooking.endTime,
      purpose: populatedBooking.purpose,
      bookingId: populatedBooking._id.toString()
    }

    // Send appropriate emails based on booking status
    if (initialStatus === 'approved') {
      // Send confirmation to incubated user
      await sendBookingConfirmation(session.user.email, bookingDetails)
      // Send notification to admin
      await sendAdminNotification(process.env.ADMIN_EMAIL, bookingDetails)
    } else {
      // Send approval request to admin
      await sendApprovalRequest(process.env.ADMIN_EMAIL, bookingDetails)
    }

    return NextResponse.json(populatedBooking)
  } catch (error) {
    console.error('Error creating booking:', error)
    return NextResponse.json(
      { message: 'Error creating booking' },
      { status: 500 }
    )
  }
} 