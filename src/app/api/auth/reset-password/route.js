import { NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import bcrypt from 'bcryptjs'
import User from '@/models/User'

export async function POST(req) {
  try {
    const { token, password } = await req.json()

    if (!token || !password) {
      return NextResponse.json(
        { message: 'Token and password are required' },
        { status: 400 }
      )
    }

    await connectDB()

    // Find user with valid token
    const user = await User.findOne({
      resetToken: token,
      resetTokenExpiry: { $gt: new Date() }
    })

    if (!user) {
      return NextResponse.json(
        { message: 'Invalid or expired token' },
        { status: 400 }
      )
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(password, 10)

    // Update user's password and clear reset token
    const result = await User.updateOne(
      { _id: user._id },
      {
        $set: {
          password: hashedPassword,
          resetToken: null,
          resetTokenExpiry: null
        }
      }
    )

    if (result.modifiedCount === 0) {
      throw new Error('Failed to update password')
    }

    return NextResponse.json(
      { message: 'Password has been reset successfully' },
      { status: 200 }
    )
  } catch (error) {
    console.error('Reset password error:', error)
    return NextResponse.json(
      { message: 'An error occurred while resetting your password.' },
      { status: 500 }
    )
  }
} 