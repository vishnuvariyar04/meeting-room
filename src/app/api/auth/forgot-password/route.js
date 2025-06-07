import { NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import crypto from 'crypto'
import { sendEmail } from '@/lib/email'
import User from '@/models/User'

export async function POST(req) {
  try {
    const { email } = await req.json()

    if (!email) {
      return NextResponse.json(
        { message: 'Email is required' },
        { status: 400 }
      )
    }

    // Check if SendGrid is configured
    if (!process.env.SENDGRID_API_KEY || !process.env.SENDGRID_FROM_EMAIL) {
      console.error('SendGrid configuration missing:', {
        hasApiKey: !!process.env.SENDGRID_API_KEY,
        hasFromEmail: !!process.env.SENDGRID_FROM_EMAIL
      })
      throw new Error('Email service is not configured')
    }

    await connectDB()
    console.log('Looking up user with email:', email)
    
    const user = await User.findOne({ email })
    console.log('User lookup result:', { 
      found: !!user,
      email,
      hasResetToken: !!user?.resetToken,
      hasResetTokenExpiry: !!user?.resetTokenExpiry
    })

    if (!user) {
      // For security reasons, we don't want to reveal if an email exists
      return NextResponse.json(
        { message: 'If your email is registered, you will receive password reset instructions.' },
        { status: 200 }
      )
    }

    // Generate a random token
    const token = crypto.randomBytes(32).toString('hex')
    const tokenExpiry = new Date(Date.now() + 3600000) // Token expires in 1 hour

    console.log('Storing reset token:', {
      email,
      token,
      tokenExpiry: tokenExpiry.toISOString(),
      currentTime: new Date().toISOString()
    })

    // Store the token in the database
    try {
      const result = await User.findOneAndUpdate(
        { email },
        {
          $set: {
            resetToken: token,
            resetTokenExpiry: tokenExpiry
          }
        },
        { new: true }
      )

      console.log('Update result:', result)

      if (!result) {
        throw new Error('Failed to update user with reset token')
      }

      // Use NEXT_PUBLIC_BASE_URL for the reset URL
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
      const resetUrl = `${baseUrl}/reset-password/${token}`

      console.log('Sending reset email to:', email)
      console.log('Reset URL:', resetUrl)

      // Send email using SendGrid
      await sendEmail({
        to: email,
        subject: 'Password Reset Request',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #FF6B00;">Password Reset Request</h2>
            <p>You requested a password reset for your account.</p>
            <p>Click the button below to reset your password:</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetUrl}" 
                 style="background: linear-gradient(to right, #FF6B00, #FF8F3F); 
                        color: white; 
                        padding: 12px 24px; 
                        text-decoration: none; 
                        border-radius: 8px; 
                        display: inline-block;">
                Reset Password
              </a>
            </div>
            <p>This link will expire in 1 hour.</p>
            <p>If you didn't request this, please ignore this email.</p>
            <hr style="border: 1px solid #eee; margin: 20px 0;">
            <p style="color: #666; font-size: 12px;">
              This is an automated message, please do not reply to this email.
            </p>
          </div>
        `,
      })

      console.log('Reset email sent successfully')

      return NextResponse.json(
        { message: 'If your email is registered, you will receive password reset instructions.' },
        { status: 200 }
      )
    } catch (saveError) {
      console.error('Error saving token:', saveError)
      throw saveError
    }
  } catch (error) {
    console.error('Forgot password error:', error)
    return NextResponse.json(
      { message: 'An error occurred while processing your request.' },
      { status: 500 }
    )
  }
} 