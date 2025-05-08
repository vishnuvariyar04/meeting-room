import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import connectDB from '@/lib/mongodb'
import User from '@/models/User'

export async function POST(request) {
  try {
    const body = await request.json()
    const { name, email, password, startupName, role } = body

    console.log('Registration attempt for:', { name, email, startupName, role })

    if (!name || !email || !password || !startupName) {
      console.log('Missing required fields:', { name, email, startupName })
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    try {
      await connectDB()
      console.log('MongoDB connected for registration')
    } catch (error) {
      console.error('MongoDB connection error in registration:', error)
      return NextResponse.json(
        { error: 'Database connection error' },
        { status: 500 }
      )
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email })
    if (existingUser) {
      console.log('User already exists:', email)
      return NextResponse.json(
        { error: 'User already exists' },
        { status: 400 }
      )
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10)

    // Create user
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      startupName,
      role: role || 'external', // Default to external if not specified
    })

    console.log('User created successfully:', { id: user._id, email: user.email })

    // Remove password from response
    const { password: _, ...userWithoutPassword } = user.toObject()

    return NextResponse.json(userWithoutPassword)
  } catch (error) {
    console.error('Error in registration:', error)
    return NextResponse.json(
      { error: error.message || 'Error creating user' },
      { status: 500 }
    )
  }
} 