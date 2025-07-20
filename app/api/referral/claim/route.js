import { NextResponse } from 'next/server';
import { createReferral, getUserById, getWalletByAddress, getUserByReferralCode, getUserByCustomCode, updateUserReferredBy } from '@/lib/database';

// Rate limiting
const rateLimits = new Map();

export const dynamic = 'force-dynamic';

export async function POST(req) {
  try {
    const body = await req.json();
    const { userAddress, friendCode } = body;
    
    if (!userAddress || !friendCode) {
      return NextResponse.json({ error: 'User address and friend code are required' }, { status: 400 });
    }
    
    // Rate limiting check
    const clientIp = req.headers.get('x-forwarded-for') || 'unknown';
    const rateKey = `${userAddress}:${clientIp}`;
    const now = Date.now();
    
    if (rateLimits.has(rateKey)) {
      const lastAttempt = rateLimits.get(rateKey);
      const timeSinceLastAttempt = now - lastAttempt;
      
      // 30 seconds cooldown
      if (timeSinceLastAttempt < 30000) {
        return NextResponse.json({ 
          error: 'Please wait before trying again',
          retryAfter: Math.ceil((30000 - timeSinceLastAttempt) / 1000)
        }, { status: 429 });
      }
    }
    
    // Update rate limit
    rateLimits.set(rateKey, now);
    
    // Clean up old rate limits (optional)
    if (rateLimits.size > 1000) {
      const fiveMinutesAgo = now - 300000;
      for (const [key, timestamp] of rateLimits.entries()) {
        if (timestamp < fiveMinutesAgo) {
          rateLimits.delete(key);
        }
      }
    }
    
    // Get user from address
    const wallet = await getWalletByAddress(userAddress);
    if (!wallet) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    
    const userId = wallet.user_id;
    const user = await getUserById(userId);
    
    // Check if user already has a referrer
    if (user.referred_by) {
      return NextResponse.json({ error: 'You already have a referrer' }, { status: 400 });
    }
    
    // Find friend by referral code - first try custom code
    let friend = await getUserByCustomCode(friendCode);
    
    // If not found, try regular referral code
    if (!friend) {
      friend = await getUserByReferralCode(friendCode);
    }
    
    if (!friend) {
      return NextResponse.json({ error: 'Invalid referral code' }, { status: 400 });
    }
    
    // Check if user is trying to refer themselves
    if (friend.id === userId) {
      return NextResponse.json({ error: 'You cannot use your own referral code' }, { status: 400 });
    }
    
    // Update user's referred_by
    await updateUserReferredBy(userId, friend.id);
    
    // Create referral record
    const referral = await createReferral(friend.id, userId, friendCode);
    
    return NextResponse.json({ 
      success: true, 
      message: 'Referral linked successfully',
      referredBy: friend.id
    });
    
  } catch (error) {
    console.error('Error claiming referral:', error);
    return NextResponse.json({ error: 'Failed to claim referral' }, { status: 500 });
  }
} 