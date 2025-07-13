import { NextResponse } from 'next/server';
import { getReferralClaims, approveReferralClaim } from '@/lib/database';

export async function GET() {
  const claims = await getReferralClaims();
  return NextResponse.json(claims);
}

export async function POST(req) {
  const { claimId } = await req.json();
  await approveReferralClaim(claimId);
  return NextResponse.json({ success: true });
} 