import { NextResponse } from 'next/server';
import { getWalletByAddress, getUserById, isCustomCodeAvailable, setUserCustomCode } from '@/lib/database';

// Rate limiting
const rateLimits = new Map();

export const dynamic = 'force-dynamic';

export async function POST(req) {
  try {
    const body = await req.json();
    const { userAddress, code } = body;
    
    if (!userAddress || !code) {
      return NextResponse.json({ error: 'User address and code are required' }, { status: 400 });
    }
    
    // Validate code format
    const codeRegex = /^[a-zA-Z0-9_]{4,12}$/;
    if (!codeRegex.test(code)) {
      return NextResponse.json({ 
        error: 'Invalid code format. Use 4-12 characters (letters, numbers, underscore)' 
      }, { status: 400 });
    }
    
    // Rate limiting check
    const clientIp = req.headers.get('x-forwarded-for') || 'unknown';
    const rateKey = `${userAddress}:${clientIp}`;
    const now = Date.now();
    
    if (rateLimits.has(rateKey)) {
      const lastAttempt = rateLimits.get(rateKey);
      const timeSinceLastAttempt = now - lastAttempt;
      
      // 10 seconds cooldown
      if (timeSinceLastAttempt < 10000) {
        return NextResponse.json({ 
          error: 'Please wait before trying again',
          retryAfter: Math.ceil((10000 - timeSinceLastAttempt) / 1000)
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
    
    // Check if user already has a custom code
    if (user.custom_code) {
      return NextResponse.json({ error: 'You already have a custom referral code' }, { status: 400 });
    }
    
    // Check if code is available
    const isAvailable = await isCustomCodeAvailable(code);
    if (!isAvailable) {
      return NextResponse.json({ error: 'This code is already taken' }, { status: 400 });
    }
    
    // Set custom code
    const updatedUser = await setUserCustomCode(userId, code);
    
    return NextResponse.json({ 
      success: true, 
      message: 'Referral code set successfully',
      customCode: code
    });
    
  } catch (error) {
    console.error('Error setting custom referral code:', error);
    
    if (error.message === 'User already has a custom referral code') {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    
    return NextResponse.json({ error: 'Failed to set custom referral code' }, { status: 500 });
  }
} 