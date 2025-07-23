import { NextResponse } from 'next/server';
import { getLastDepositProgress, getLastSwapProgress } from '@/lib/database';

export const dynamic = 'force-dynamic';

export async function GET(req, { params }) {
  try {
    const { userId } = params;
    const deposit = await getLastDepositProgress(userId);
    const swap = await getLastSwapProgress(userId);
    return NextResponse.json({
      deposit: {
        progress: `${deposit ? deposit.total_deposit_usd.toFixed(2) : '0.00'}/20`,
        status: deposit ? deposit.status : 'in_progress',
      },
      swap: {
        progress: `${swap ? swap.total_swap_usd.toFixed(2) : '0.00'}/20`,
        status: swap ? swap.status : 'in_progress',
      }
    });
  } catch (error) {
    console.error('Error fetching task status:', error);
    return NextResponse.json({ error: 'Failed to fetch task status' }, { status: 500 });
  }
} 