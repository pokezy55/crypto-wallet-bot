import { NextResponse } from 'next/server';
import { createUser } from '@/lib/database';

// Prevent prerendering
export const dynamic = 'force-dynamic';

export async function POST(req) {
  try {
    const data = await req.json();
    const user = await createUser(data);
    return NextResponse.json(user);
  } catch (error) {
    console.error('Error processing webhook:', error);
    return NextResponse.json(
      { error: 'Failed to process webhook' },
      { status: 500 }
    );
  }
} 