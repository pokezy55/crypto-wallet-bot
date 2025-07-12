import { NextResponse } from 'next/server';
import { getUserTasks } from '@/lib/database';

export async function GET(req, { params }) {
  const { userId } = params;
  const tasks = await getUserTasks(Number(userId));
  return NextResponse.json(tasks);
} 