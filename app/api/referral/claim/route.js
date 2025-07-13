import { NextResponse } from 'next/server';
import { claimReferralEarning } from '@/lib/database';

// Prevent prerendering
export const dynamic = 'force-dynamic';

export async function POST(req) {
  try {
    const { userId } = await req.json();
    await claimReferralEarning(userId);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error claiming referral earning:', error);
    return NextResponse.json(
      { error: 'Failed to claim referral earning' },
      { status: 500 }
    );
  }
} 