import { NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import User from '@/models/User'

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url)
    const token = searchParams.get('token')

    if (!token) {
      return NextResponse.json(
        { message: 'Token is required' },
        { status: 400 }
      )
    }

    await connectDB()

    console.log('Token verification:', {
      token,
      currentTime: new Date().toISOString()
    })

    const user = await User.findOne({
      resetToken: token,
      resetTokenExpiry: { $gt: new Date() }
    })

    console.log('Token verification result:', {
      token,
      userFound: !!user,
      currentTime: new Date().toISOString(),
      tokenExpiry: user?.resetTokenExpiry?.toISOString(),
      userId: user?._id
    })

    if (!user) {
      // Try to find if token exists but is expired
      const expiredUser = await User.findOne({ resetToken: token })
      if (expiredUser) {
        console.log('Token found but expired:', {
          token,
          expiry: expiredUser.resetTokenExpiry?.toISOString(),
          currentTime: new Date().toISOString()
        })
        return NextResponse.json(
          { message: 'Token has expired. Please request a new password reset.' },
          { status: 400 }
        )
      }

      return NextResponse.json(
        { message: 'Invalid token. Please request a new password reset.' },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { message: 'Token is valid' },
      { status: 200 }
    )
  } catch (error) {
    console.error('Token verification error:', error)
    return NextResponse.json(
      { message: 'An error occurred while verifying the token.' },
      { status: 500 }
    )
  }
} 