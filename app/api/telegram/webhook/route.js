import { NextResponse } from 'next/server';
import { createUser } from '@/lib/database';
import fs from 'fs/promises';
import path from 'path';

export const dynamic = 'force-dynamic';

async function isUserBanned(userId) {
  try {
    const filePath = path.join(process.cwd(), 'banned.txt');
    const content = await fs.readFile(filePath, 'utf8').catch(() => '');
    return content.split('\n').includes(String(userId));
  } catch {
    return false;
  }
}

async function banUser(userId) {
  const filePath = path.join(process.cwd(), 'banned.txt');
  await fs.appendFile(filePath, `${userId}\n`, 'utf8');
}

export async function POST(req) {
  try {
    const data = await req.json();

    // Cek jika command /ban user
    if (data.message && data.message.text) {
      const text = data.message.text.trim();
      if (text.startsWith('/ban')) {
        const parts = text.split(' ');
        if (parts.length > 1) {
          const userToBan = parts[1];
          await banUser(userToBan);
          return NextResponse.json({ success: true, message: `User ${userToBan} banned.` });
        }
      }
    }

    // Cek banned sebelum proses lain
    const userId = data.message?.from?.id || data.userId;
    if (userId && await isUserBanned(userId)) {
      return NextResponse.json({ error: 'User is banned' }, { status: 403 });
    }

    // Jika ada pesan /start, insert user ke database
    if (data.message && data.message.text && data.message.text.startsWith('/start')) {
      const from = data.message.from;
      if (from && from.id) {
        const userData = {
          id: from.id, // WAJIB diisi!
          username: from.username || null,
          first_name: from.first_name || null,
          last_name: from.last_name || null,
          photo_url: from.photo_url || null
        };
        await createUser(userData);
      } else {
        console.error('Telegram user id tidak ditemukan di message.from');
      }
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Error processing webhook:', error);
    return NextResponse.json(
      { error: 'Failed to process webhook' },
      { status: 500 }
    );
  }
} 