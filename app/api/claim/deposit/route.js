import { NextResponse } from 'next/server';
import { getDepositClaims, approveDepositClaim } from '@/lib/database';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const claims = await getDepositClaims();
    return NextResponse.json(claims);
  } catch (error) {
    console.error('Error fetching deposit claims:', error);
    return NextResponse.json(
      { error: 'Failed to fetch deposit claims' },
      { status: 500 }
    );
  }
}

export async function POST(req) {
  try {
    const { claimId } = await req.json();
    await approveDepositClaim(claimId);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error approving deposit claim:', error);
    return NextResponse.json(
      { error: 'Failed to approve deposit claim' },
      { status: 500 }
    );
  }
} 