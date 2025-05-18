import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { sendApprovalStatus } from '@/lib/email';
import Booking from '@/models/Booking';

export async function GET(request, { params }) {
  try {
    const { id } = params;
    await connectDB();

    // Update booking status and populate details
    const booking = await Booking.findByIdAndUpdate(
      id,
      { $set: { status: 'rejected' } },
      { new: true }
    ).populate('room', 'name')
     .populate('user', 'email name');

    if (!booking) {
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_BASE_URL}/dashboard?tab=bookings&error=Booking not found`);
    }

    // Prepare booking details for email
    const bookingDetails = {
      roomName: booking.room.name,
      userName: booking.user.name,
      date: booking.date,
      startTime: booking.startTime,
      endTime: booking.endTime,
      purpose: booking.purpose,
      bookingId: booking._id.toString()
    };

    // Send rejection emails
    await sendApprovalStatus(booking.user.email, bookingDetails, 'rejected');
    await sendApprovalStatus(process.env.ADMIN_EMAIL, bookingDetails, 'rejected');

    // Redirect to dashboard with bookings tab active and success message
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_BASE_URL}/dashboard?tab=bookings&status=rejected&bookingId=${id}`);
  } catch (error) {
    console.error('Error rejecting booking:', error);
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_BASE_URL}/dashboard?tab=bookings&error=Failed to reject booking`);
  }
} 