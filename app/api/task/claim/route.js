import { NextResponse } from 'next/server';
import { claimTaskReward } from '@/lib/database';

export async function POST(req) {
  const { taskId } = await req.json();
  const result = await claimTaskReward(taskId);
  return NextResponse.json(result);
} 