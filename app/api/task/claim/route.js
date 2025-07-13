import { NextResponse } from 'next/server';
import { claimTaskReward } from '@/lib/database';

export async function POST(req) {
  const { userId, taskId } = await req.json();
  await claimTaskReward(userId, taskId);
  return NextResponse.json({ success: true });
} 