import { NextResponse } from 'next/server';
import { getUserReferralData } from '@/lib/database';

// Prevent prerendering
export const dynamic = 'force-dynamic';

export async function GET(req, { params }) {
  try {
    const { userId } = params;
    const data = await getUserReferralData(userId);
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching referral data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch referral data' },
      { status: 500 }
    );
  }
} 