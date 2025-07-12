import { NextResponse } from 'next/server';
import { createWallet } from '@/lib/database';

export async function POST(req) {
  const { userId, address, seedPhraseEncrypted, privateKeyEncrypted } = await req.json();
  const wallet = await createWallet(userId, { address, seedPhraseEncrypted, privateKeyEncrypted });
  return NextResponse.json(wallet);
} 