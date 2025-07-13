import { NextResponse } from 'next/server';
import { getSwapClaims, approveSwapClaim } from '@/lib/database';

export async function GET() {
  const claims = await getSwapClaims();
  return NextResponse.json(claims);
}

export async function POST(req) {
  const { claimId } = await req.json();
  await approveSwapClaim(claimId);
  return NextResponse.json({ success: true });
} 