import { NextResponse } from 'next/server'
import { 
  getWalletByAddress, 
  getUserById, 
  getReferralStats, 
  getUserReferrals 
} from '../../../../lib/database'

export async function GET(req) {
  try {
    // Get user parameter (can be userId or wallet address)
    const { searchParams } = new URL(req.url)
    const user = searchParams.get('user')
    
    if (!user) {
      return NextResponse.json({ error: 'User parameter is required' }, { status: 400 })
    }
    
    let userId
    
    // Check if user is a wallet address
    if (user.startsWith('0x')) {
      const wallet = await getWalletByAddress(user)
      if (!wallet) {
        return NextResponse.json({ error: 'Wallet not found' }, { status: 404 })
      }
      userId = wallet.user_id
    } else {
      userId = user
    }
    
    // Get referral stats
    const stats = await getReferralStats(userId)
    
    // Get referrals list
    const referrals = await getUserReferrals(userId)
    
    // Calculate total earned (valid referrals * $0.5)
    const validReferrals = referrals.filter(ref => {
      // A referral is valid if they completed both tasks (deposit >= $20 and swap >= $10)
      return ref.deposit_completed && ref.swap_completed
    })
    
    const totalEarned = validReferrals.length * 0.5
    
    // Get user details for custom code
    const userDetails = await getUserById(userId)
    
    // Only use custom code, no fallback to auto-generated code
    const referralCode = userDetails?.custom_code || ''
    
    return NextResponse.json({
      stats: {
        totalReferrals: stats.total_referrals || 0,
        totalEarned,
        referralCode
      },
      referrals: referrals.map(ref => ({
        username: ref.username || 'Anonymous',
        address: ref.address,
        joinedAt: ref.created_at,
        isValid: ref.deposit_completed && ref.swap_completed,
        rewardStatus: ref.reward_status || 'pending'
      }))
    })
    
  } catch (error) {
    console.error('Error fetching referral progress:', error)
    return NextResponse.json({ error: 'Failed to fetch referral progress' }, { status: 500 })
  }
} 