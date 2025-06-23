import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import connectDB from '@/lib/mongodb'
import User from '@/models/User'
import { sendRegistrationStatus } from '@/lib/email'

export async function GET(request, { params }) {
  try {
    const { id } = params
    console.log('Processing email approval for registration:', id)
    
    if (!id) {
      console.error('No registration ID provided')
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/dashboard?tab=registrations&error=No registration ID provided`);
    }

    await connectDB()
    console.log('Database connected')

    // Find the user with pending status
    const user = await User.findById(id)
    if (!user) {
      console.log('User not found:', id)
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/dashboard?tab=registrations&error=User not found`);
    }

    console.log('Found user:', user.email, 'Status:', user.status)

    if (user.status !== 'pending') {
      console.log('User already processed:', user.status)
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/dashboard?tab=registrations&error=User registration has already been processed`);
    }

    // Update user status to approved
    user.status = 'approved'
    user.approvedBy = null // Set to null for email approvals since we don't have admin session
    user.approvedAt = new Date()
    
    console.log('Saving user with status:', user.status)
    await user.save()
    console.log('User saved successfully')

    // Send approval email
    try {
      console.log('Sending approval email to:', user.email)
      await sendRegistrationStatus(user, 'approved')
      console.log('Approval email sent successfully')
    } catch (emailError) {
      console.error('Error sending approval email:', emailError)
      // Don't fail the approval if email fails
    }

    // Redirect to dashboard with registrations tab active and success message
    console.log('Redirecting to dashboard with success')
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/dashboard?tab=registrations&status=approved&registrationId=${id}`);
  } catch (error) {
    console.error('Error approving registration:', error);
    console.error('Error stack:', error.stack);
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/dashboard?tab=registrations&error=Failed to approve registration: ${error.message}`);
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

    // Update user status to approved
    user.status = 'approved'
    user.approvedBy = null
    user.approvedAt = new Date()
    await user.save()

    // Send approval email
    try {
      await sendRegistrationStatus(user, 'approved')
    } catch (emailError) {
      console.error('Error sending approval email:', emailError)
      // Don't fail the approval if email fails
    }

    // Remove password from response
    const { password: _, ...userWithoutPassword } = user.toObject()

    return NextResponse.json({
      message: 'Registration approved successfully',
      user: userWithoutPassword
    })
  } catch (error) {
    console.error('Error approving registration:', error)
    return NextResponse.json(
      { error: error.message || 'Error approving registration' },
      { status: 500 }
    )
  }
}