import { NextResponse } from 'next/server';
import { getSwapClaims, approveSwapClaim } from '@/lib/database';

// Prevent prerendering
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const claims = await getSwapClaims();
    return NextResponse.json(claims);
  } catch (error) {
    console.error('Error fetching swap claims:', error);
    return NextResponse.json(
      { error: 'Failed to fetch swap claims' },
      { status: 500 }
    );
  }
}

export async function POST(req) {
  try {
    const { claimId } = await req.json();
    await approveSwapClaim(claimId);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error approving swap claim:', error);
    return NextResponse.json(
      { error: 'Failed to approve swap claim' },
      { status: 500 }
    );
  }
} 