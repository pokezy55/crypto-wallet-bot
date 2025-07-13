import { NextResponse } from 'next/server';
import { claimReferralEarning } from '@/lib/database';

export async function POST(req) {
  const { userId } = await req.json();
  await claimReferralEarning(userId);
  return NextResponse.json({ success: true });
} 