import { NextResponse } from 'next/server';
import { getStats } from '@/lib/database';

// Prevent prerendering
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const stats = await getStats();
    return NextResponse.json(stats);
  } catch (error) {
    console.error('Error fetching stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch stats' },
      { status: 500 }
    );
  }
} 