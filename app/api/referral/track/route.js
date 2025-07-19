import { NextResponse } from 'next/server';
import { createReferral, getUserById, getWalletByAddress } from '@/lib/database';
import pool from '@/lib/database';

export const dynamic = 'force-dynamic';

export async function POST(req) {
  try {
    const body = await req.json();
    const { referralCode, userId, walletAddress } = body;
    
    if (!referralCode || !userId) {
      return NextResponse.json({ error: 'Referral code and user ID are required' }, { status: 400 });
    }
    
    // Extract referrer ID from referral code
    // Format: username or wallet address part
    let referrerId;
    
    // Try to find user by username first
    try {
      // Search for user with this username
      const { rows } = await pool.query('SELECT id FROM users WHERE username = $1', [referralCode]);
      if (rows.length > 0) {
        referrerId = rows[0].id;
      }
    } catch (e) {
      console.log('Not a username, trying to match by wallet address part');
    }
    
    // If not found by username, try to find by wallet address part
    if (!referrerId) {
      try {
        // Search for wallets where address contains the referral code
        const { rows } = await pool.query('SELECT user_id FROM wallets WHERE address LIKE $1', [`%${referralCode}%`]);
        if (rows.length > 0) {
          referrerId = rows[0].user_id;
        }
      } catch (e) {
        console.error('Error finding user by wallet address part:', e);
      }
    }
    
    // If still not found, return error
    if (!referrerId) {
      return NextResponse.json({ error: 'Invalid referral code' }, { status: 400 });
    }
    
    // Check if referrer and new user are different
    if (referrerId === userId) {
      return NextResponse.json({ error: 'Cannot refer yourself' }, { status: 400 });
    }
    
    // Create referral record
    const referral = await createReferral(referrerId, userId, referralCode);
    
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