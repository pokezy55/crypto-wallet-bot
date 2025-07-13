import { NextResponse } from 'next/server';
import { createUser } from '@/lib/database';

// Prevent prerendering
export const dynamic = 'force-dynamic';

export async function POST(req) {
  try {
    const userData = await req.json();
    const user = await createUser(userData);
    return NextResponse.json(user);
  } catch (error) {
    console.error('Error creating user:', error);
    return NextResponse.json(
      { error: 'Failed to create user' },
      { status: 500 }
    );
  }
} 