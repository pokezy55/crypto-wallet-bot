import { NextResponse } from 'next/server';
import { getUserSeedPhrase } from '@/lib/database';

// Prevent prerendering
export const dynamic = 'force-dynamic';

export async function GET(req, { params }) {
  try {
    const { userId } = params;
    const seedPhrase = await getUserSeedPhrase(userId);
    return NextResponse.json({ seedPhrase });
  } catch (error) {
    console.error('Error fetching seed phrase:', error);
    return NextResponse.json(
      { error: 'Failed to fetch seed phrase' },
      { status: 500 }
    );
  }
} 