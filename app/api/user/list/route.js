import { NextResponse } from 'next/server';
import { getAllUsers } from '@/lib/database';

// Prevent prerendering
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const users = await getAllUsers();
    return NextResponse.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    );
  }
} 