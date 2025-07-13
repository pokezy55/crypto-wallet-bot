import { NextResponse } from 'next/server';
import { banUser } from '@/lib/database';
import { getUserById } from '@/lib/database';

// Prevent prerendering
export const dynamic = 'force-dynamic';

export async function PATCH(req, { params }) {
  try {
    const { userId } = params;
    await banUser(userId);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error banning user:', error);
    return NextResponse.json(
      { error: 'Failed to ban user' },
      { status: 500 }
    );
  }
}

export async function GET(req, { params }) {
  try {
    const { userId } = params;
    const user = await getUserById(userId);
    return NextResponse.json(user);
  } catch (error) {
    console.error('Error fetching user:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user' },
      { status: 500 }
    );
  }
} 