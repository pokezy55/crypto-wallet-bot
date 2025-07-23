import { NextResponse } from 'next/server';
import { getDepositClaims } from '@/lib/database';

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