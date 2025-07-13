import { NextResponse } from 'next/server';
import { getReferralClaims, approveReferralClaim } from '@/lib/database';

// Prevent prerendering
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const claims = await getReferralClaims();
    return NextResponse.json(claims);
  } catch (error) {
    console.error('Error fetching referral claims:', error);
    return NextResponse.json(
      { error: 'Failed to fetch referral claims' },
      { status: 500 }
    );
  }
}

export async function POST(req) {
  try {
    const { claimId } = await req.json();
    await approveReferralClaim(claimId);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error approving referral claim:', error);
    return NextResponse.json(
      { error: 'Failed to approve referral claim' },
      { status: 500 }
    );
  }
} 