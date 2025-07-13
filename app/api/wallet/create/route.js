import { NextResponse } from 'next/server';
import { createWallet } from '@/lib/database';

// Prevent prerendering
export const dynamic = 'force-dynamic';

export async function POST(req) {
  try {
    const { userId, walletData } = await req.json();
    const wallet = await createWallet(userId, walletData);
    return NextResponse.json(wallet);
  } catch (error) {
    console.error('Error creating wallet:', error);
    return NextResponse.json(
      { error: 'Failed to create wallet' },
      { status: 500 }
    );
  }
} 