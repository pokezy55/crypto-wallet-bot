import { NextResponse } from 'next/server';
import { getUserReferrals, getReferralStats, getWalletByUserId, getWalletByAddress } from '@/lib/database';
import pool from '@/lib/database';

export const dynamic = 'force-dynamic';

export async function GET(req) {
  try {
    console.log('API referral/progress called');
    
    // Get user parameter (can be userId or wallet address)
    const { searchParams } = new URL(req.url);
    const user = searchParams.get('user');
    
    console.log('User parameter:', user);
    
    if (!user) {
      console.log('User parameter is missing');
      return NextResponse.json({ 
        stats: {
          totalReferrals: 0,
          totalEarned: 0,
          referralCode: 'default'
        },
        referrals: []
      });
    }
    
    // Return dummy data for now to fix the error
    return NextResponse.json({
      stats: {
        totalReferrals: 0,
        totalEarned: 0,
        referralCode: `REF${user}`
      },
      referrals: []
    });
    
  } catch (error) {
    console.error('Error fetching referral progress:', error);
    
    // Return a fallback response with empty data
    return NextResponse.json({
      stats: {
        totalReferrals: 0,
        totalEarned: 0,
        referralCode: 'error'
      },
      referrals: []
    });
  }
} 