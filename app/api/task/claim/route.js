import { NextResponse } from 'next/server';
import { claimTaskReward } from '@/lib/database';

// Prevent prerendering
export const dynamic = 'force-dynamic';

export async function POST(req) {
  try {
    const { userId, taskId } = await req.json();
    await claimTaskReward(userId, taskId);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error claiming task reward:', error);
    return NextResponse.json(
      { error: 'Failed to claim task reward' },
      { status: 500 }
    );
  }
} 