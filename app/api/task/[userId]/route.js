import { NextResponse } from 'next/server';
import { getUserTaskProgress } from '@/lib/database';

export async function GET(req, { params }) {
  const { userId } = params;
  const progress = await getUserTaskProgress(userId);
  return NextResponse.json(progress);
} 