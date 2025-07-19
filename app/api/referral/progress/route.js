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
      return NextResponse.json({ error: 'User parameter is required' }, { status: 400 });
    }
    
    let userId;
    
    // Check if user is a wallet address
    if (user.startsWith('0x')) {
      console.log('User is a wallet address');
      const wallet = await getWalletByAddress(user);
      if (!wallet) {
        console.log('Wallet not found');
        return NextResponse.json({ error: 'Wallet not found' }, { status: 404 });
      }
      userId = wallet.user_id;
    } else {
      userId = user;
    }
    
    console.log('Using userId:', userId);
    
    // Get referral stats
    const stats = await getReferralStats(userId);
    console.log('Referral stats:', stats);
    
    // Get referrals list
    const referrals = await getUserReferrals(userId);
    console.log('Referrals list:', referrals);
    
    // Calculate total earned (valid referrals * $0.5)
    const validReferrals = referrals.filter(ref => {
      // A referral is valid if they completed both tasks (deposit >= $20 and swap >= $10)
      return ref.deposit_completed && ref.swap_completed;
    });
    
    const totalEarned = validReferrals.length * 0.5;
    
    // Get user wallet for referral code
    const wallet = await getWalletByUserId(userId);
    console.log('User wallet:', wallet ? 'Found' : 'Not found');
    
    // Generate referral code: username or wallet address part
    let referralCode;
    
    // Try to use Telegram username first
    const { rows } = await pool.query('SELECT username FROM users WHERE id = $1', [userId]);
    console.log('Username query result:', rows);
    
    if (rows.length > 0 && rows[0].username) {
      referralCode = rows[0].username;
    } else if (wallet) {
      // Otherwise use first 6 chars of wallet address
      referralCode = wallet.address.substring(2, 8);
    } else {
      referralCode = userId.toString();
    }
    
    console.log('Generated referral code:', referralCode);
    
    const response = {
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
    };
    
    console.log('Sending response:', response);
    
    return NextResponse.json(response);
    
  } catch (error) {
    console.error('Error fetching referral progress:', error);
    return NextResponse.json({ error: 'Failed to fetch referral progress' }, { status: 500 });
  }
} 