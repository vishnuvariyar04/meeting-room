import { NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import User from '@/models/User'

export async function POST(request) {
  try {
    await connectDB()

    // Update all existing users to have approved status if they don't have a status
    const result = await User.updateMany(
      { status: { $exists: false } },
      { $set: { status: 'approved' } }
    )

    console.log(`Migration completed: ${result.modifiedCount} users updated`)

    return NextResponse.json({
      message: `Migration completed successfully. ${result.modifiedCount} users updated.`,
      modifiedCount: result.modifiedCount
    })
  } catch (error) {
    console.error('Migration error:', error)
    return NextResponse.json(
      { error: 'Migration failed' },
      { status: 500 }
    )
  }
}