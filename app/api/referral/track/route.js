import { NextResponse } from 'next/server';
import { createReferral, getUserById } from '@/lib/database';

export const dynamic = 'force-dynamic';

export async function POST(req) {
  try {
    const body = await req.json();
    const { referralCode, newUserId } = body;
    
    if (!referralCode || !newUserId) {
      return NextResponse.json({ error: 'Referral code and new user ID are required' }, { status: 400 });
    }
    
    // Extract referrer ID from referral code
    // Format: REFxxxxx where xxxxx is either userId or part of wallet address
    let referrerId;
    
    if (referralCode.startsWith('REF')) {
      const code = referralCode.substring(3); // Remove 'REF' prefix
      
      // Try to find user by ID first
      try {
        const user = await getUserById(code);
        if (user) {
          referrerId = user.id;
        }
      } catch (e) {
        console.log('Not a user ID, trying to match by wallet address part');
      }
      
      // If not found by ID, try to find by wallet address part
      if (!referrerId) {
        // This would require a new function to find user by partial wallet address
        // For now, we'll just return an error
        return NextResponse.json({ error: 'Invalid referral code' }, { status: 400 });
      }
    } else {
      return NextResponse.json({ error: 'Invalid referral code format' }, { status: 400 });
    }
    
    // Check if referrer and new user are different
    if (referrerId === newUserId) {
      return NextResponse.json({ error: 'Cannot refer yourself' }, { status: 400 });
    }
    
    // Create referral record
    const referral = await createReferral(referrerId, newUserId, referralCode);
    
    return NextResponse.json({ success: true, referral });
  } catch (error) {
    console.error('Error tracking referral:', error);
    
    // Handle duplicate referral
    if (error.code === '23505') { // PostgreSQL unique violation code
      return NextResponse.json({ error: 'User already has a referrer' }, { status: 409 });
    }
    
    return NextResponse.json({ error: 'Failed to track referral' }, { status: 500 });
  }
} 