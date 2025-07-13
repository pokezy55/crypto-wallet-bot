import { NextResponse } from 'next/server';
import { claimReferralEarning } from '@/lib/database';
import fs from 'fs/promises';
import path from 'path';

// Prevent prerendering
export const dynamic = 'force-dynamic';

export async function POST(req) {
  try {
    const { user, address, amount, userId } = await req.json();
    // Simpan ke file TXT
    const ip = req.headers.get('x-forwarded-for') || '';
    const line = `${user}|${address}|${amount}|claimreff|${ip}\n`;
    const filePath = path.join(process.cwd(), 'claims.txt');
    await fs.appendFile(filePath, line, 'utf8');
    // Proses reward (opsional, bisa dihapus jika tidak perlu DB)
    await claimReferralEarning(userId);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error claiming referral earning:', error);
    return NextResponse.json(
      { error: 'Failed to claim referral earning' },
      { status: 500 }
    );
  }
} 