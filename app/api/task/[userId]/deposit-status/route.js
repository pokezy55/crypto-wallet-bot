import { NextResponse } from 'next/server';
import { getLastDepositProgress } from '@/lib/database';

export const dynamic = 'force-dynamic';

export async function GET(req, { params }) {
  try {
    const { userId } = params;
    const progress = await getLastDepositProgress(userId);
    if (!progress) {
      return NextResponse.json({
        totalDepositUSD: 0,
        progress: 0,
        status: 'in_progress',
        target: 20,
        updatedAt: null
      });
    }
    return NextResponse.json({
      totalDepositUSD: progress.total_deposit_usd,
      progress: Math.min(20, progress.total_deposit_usd),
      status: progress.status,
      target: 20,
      updatedAt: progress.updated_at
    });
  } catch (error) {
    console.error('Error fetching deposit status:', error);
    return NextResponse.json({ error: 'Failed to fetch deposit status' }, { status: 500 });
  }
} 