import { NextResponse } from 'next/server';
import { getUserReferralData } from '@/lib/database';

export async function GET(req, { params }) {
  const { userId } = params;
  const data = await getUserReferralData(userId);
  return NextResponse.json(data);
} 