import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import User from '@/models/User'
import connectDB from '@/lib/mongodb'

export async function GET(req) {
  try {
    const session = await getServerSession(authOptions)
    
    // Check if user is authenticated and is an admin
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      )
    }

    await connectDB()

    // Fetch all users except those with admin role
    const users = await User.find({ role: { $ne: 'admin' } })
      .select('-password') // Exclude password from the response
      .sort({ createdAt: -1 })

    return NextResponse.json(users)
  } catch (error) {
    console.error('Error fetching users:', error)
    return NextResponse.json(
      { message: 'Error fetching users' },
      { status: 500 }
    )
  }
} 