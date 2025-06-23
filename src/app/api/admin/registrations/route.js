import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import connectDB from '@/lib/mongodb'
import User from '@/models/User'

export async function GET(request) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    await connectDB()

    // Get query parameters
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')

    // Build query - exclude admin users and only get non-admin registrations
    let query = { role: { $ne: 'admin' } }
    if (status) {
      query.status = status
    }

    // Fetch users (registrations)
    const registrations = await User.find(query)
      .sort({ createdAt: -1 })
      .select('-password') // Exclude password from response

    return NextResponse.json(registrations)
  } catch (error) {
    console.error('Error fetching registrations:', error)
    return NextResponse.json(
      { error: error.message || 'Error fetching registrations' },
      { status: 500 }
    )
  }
}