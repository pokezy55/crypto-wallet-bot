import { NextResponse } from 'next/server'
import { 
  getUserByCustomCode, 
  createReferral 
} from '../../../../lib/database'

export async function POST(req) {
  try {
    const body = await req.json()
    const { referralCode, newUserId } = body
    
    if (!referralCode || !newUserId) {
      return NextResponse.json({ error: 'Referral code and new user ID are required' }, { status: 400 })
    }
    
    // Find referrer only by custom code
    const userByCustomCode = await getUserByCustomCode(referralCode)
    if (!userByCustomCode) {
      return NextResponse.json({ error: 'Invalid referral code' }, { status: 400 })
    }
    
    const referrerId = userByCustomCode.id
    
    // Check if referrer and new user are different
    if (referrerId === newUserId) {
      return NextResponse.json({ error: 'Cannot refer yourself' }, { status: 400 })
    }
    
    // Create referral record
    const referral = await createReferral(referrerId, newUserId, referralCode)
    
    return NextResponse.json({ success: true, referral })
  } catch (error) {
    console.error('Error tracking referral:', error)
    return NextResponse.json({ error: 'Failed to track referral' }, { status: 500 })
  }
} 