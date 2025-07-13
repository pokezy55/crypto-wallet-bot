import { NextResponse } from 'next/server';
import { getUserTasks } from '@/lib/database';

// Prevent prerendering
export const dynamic = 'force-dynamic';

export async function GET(req, { params }) {
  try {
    const { userId } = params;
    const tasks = await getUserTasks(userId);
    return NextResponse.json(tasks);
  } catch (error) {
    console.error('Error fetching tasks:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tasks' },
      { status: 500 }
    );
  }
} 