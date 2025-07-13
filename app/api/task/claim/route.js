import { NextResponse } from 'next/server';
import { claimTaskReward } from '@/lib/database';
import fs from 'fs/promises';
import path from 'path';

// Prevent prerendering
export const dynamic = 'force-dynamic';

export async function POST(req) {
  try {
    const { user, address, amount, userId, taskId } = await req.json();
    // Simpan ke file TXT
    const ip = req.headers.get('x-forwarded-for') || '';
    const line = `${user}|${address}|${amount}|claimtask|${ip}\n`;
    const filePath = path.join(process.cwd(), 'claims.txt');
    await fs.appendFile(filePath, line, 'utf8');
    // Proses reward (opsional, bisa dihapus jika tidak perlu DB)
    await claimTaskReward(userId, taskId);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error claiming task reward:', error);
    return NextResponse.json(
      { error: 'Failed to claim task reward' },
      { status: 500 }
    );
  }
} 