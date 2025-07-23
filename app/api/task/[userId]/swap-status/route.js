import { NextResponse } from 'next/server';
import { getLastSwapProgress } from '@/lib/database';

export const dynamic = 'force-dynamic';

export async function GET(req, { params }) {
  try {
    const { userId } = params;
    const progress = await getLastSwapProgress(userId);
    if (!progress) {
      return NextResponse.json({
        totalSwapUSD: 0,
        progress: 0,
        status: 'in_progress',
        target: 20,
        updatedAt: null
      });
    }
    return NextResponse.json({
      totalSwapUSD: progress.total_swap_usd,
      progress: Math.min(20, progress.total_swap_usd),
      status: progress.status,
      target: 20,
      updatedAt: progress.updated_at
    });
  } catch (error) {
    console.error('Error fetching swap status:', error);
    return NextResponse.json({ error: 'Failed to fetch swap status' }, { status: 500 });
  }
} 