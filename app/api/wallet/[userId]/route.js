import { NextResponse } from 'next/server';
import { getWalletByUserId } from '@/lib/database';

// Prevent prerendering
export const dynamic = 'force-dynamic';

export async function GET(req, { params }) {
  try {
    const { userId } = params;
    const wallet = await getWalletByUserId(userId);
    return NextResponse.json(wallet);
  } catch (error) {
    console.error('Error fetching wallet:', error);
    return NextResponse.json(
      { error: 'Failed to fetch wallet' },
      { status: 500 }
    );
  }
} 