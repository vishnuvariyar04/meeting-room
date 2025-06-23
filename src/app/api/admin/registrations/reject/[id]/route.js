import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import connectDB from '@/lib/mongodb'
import User from '@/models/User'
import { sendRegistrationStatus } from '@/lib/email'

export async function GET(request, { params }) {
  try {
    const { id } = params
    await connectDB()

    // Find the user with pending status
    const user = await User.findById(id)
    if (!user) {
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/dashboard?tab=registrations&error=User not found`);
    }

    if (user.status !== 'pending') {
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/dashboard?tab=registrations&error=User registration has already been processed`);
    }

    // Update user status to rejected with default reason
    user.status = 'rejected'
    user.approvedBy = null
    user.approvedAt = new Date()
    user.rejectionReason = 'Registration request rejected via email link'
    await user.save()

    // Send rejection email
    try {
      await sendRegistrationStatus(user, 'rejected', user.rejectionReason)
    } catch (emailError) {
      console.error('Error sending rejection email:', emailError)
      // Don't fail the rejection if email fails
    }

    // Redirect to dashboard with registrations tab active and success message
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/dashboard?tab=registrations&status=rejected&registrationId=${id}`);
  } catch (error) {
    console.error('Error rejecting registration:', error);
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/dashboard?tab=registrations&error=Failed to reject registration`);
  }
}

export async function POST(request, { params }) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { id } = params
    const body = await request.json()
    const { rejectionReason } = body

    await connectDB()

    // Find the user with pending status
    const user = await User.findById(id)
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    if (user.status !== 'pending') {
      return NextResponse.json(
        { error: 'User registration has already been processed' },
        { status: 400 }
      )
    }

    // Update user status to rejected
    user.status = 'rejected'
    user.approvedBy = session.user.id
    user.approvedAt = new Date()
    user.rejectionReason = rejectionReason || 'Registration request rejected by admin'
    await user.save()

    // Send rejection email
    try {
      await sendRegistrationStatus(user, 'rejected', rejectionReason)
    } catch (emailError) {
      console.error('Error sending rejection email:', emailError)
      // Don't fail the rejection if email fails
    }

    return NextResponse.json({
      message: 'Registration rejected successfully'
    })
  } catch (error) {
    console.error('Error rejecting registration:', error)
    return NextResponse.json(
      { error: error.message || 'Error rejecting registration' },
      { status: 500 }
    )
  }
}