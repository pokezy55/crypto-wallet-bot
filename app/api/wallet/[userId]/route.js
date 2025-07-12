import { NextResponse } from 'next/server';
import { getWalletByUserId } from '@/lib/database';

export async function GET(req, { params }) {
  const { userId } = params;
  const wallet = await getWalletByUserId(Number(userId));
  return NextResponse.json(wallet);
} 