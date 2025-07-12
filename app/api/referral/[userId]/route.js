import { NextResponse } from 'next/server';
import { getUserReferrals, getReferralStats } from '@/lib/database';

export async function GET(req, { params }) {
  const { userId } = params;
  const [stats, referrals] = await Promise.all([
    getReferralStats(Number(userId)),
    getUserReferrals(Number(userId))
  ]);
  return NextResponse.json({ stats, referrals });
} 