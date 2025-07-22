import { NextResponse } from 'next/server';
import { createUserSettings, getUserSettings } from '@/lib/database';
import crypto from 'crypto';

export async function POST(req) {
  try {
    const { userId, currentPin, newPin } = await req.json();

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    // Jika mengubah PIN (bukan hanya validasi)
    if (newPin) {
      if (!currentPin) {
        return NextResponse.json({ error: 'Current PIN is required' }, { status: 400 });
      }

      // Validasi format PIN baru
      if (!/^\d{4}$/.test(newPin)) {
        return NextResponse.json({ error: 'PIN must be 4 digits' }, { status: 400 });
      }

      // Dapatkan pengaturan pengguna saat ini
      const userSettings = await getUserSettings(userId);

      // Jika pengguna sudah memiliki PIN, validasi PIN lama
      if (userSettings?.pin_hash) {
        // Hash PIN saat ini untuk perbandingan
        const currentPinHash = crypto.createHash('sha256').update(currentPin).digest('hex');
        
        // Periksa apakah PIN saat ini cocok
        if (currentPinHash !== userSettings.pin_hash) {
          return NextResponse.json({ error: 'Current PIN is incorrect' }, { status: 401 });
        }
      }

      // Hash PIN baru
      const newPinHash = crypto.createHash('sha256').update(newPin).digest('hex');

      // Simpan PIN baru
      await createUserSettings(userId, {
        pinHash: newPinHash,
        notificationsEnabled: userSettings?.notifications_enabled ?? true,
        theme: userSettings?.theme ?? 'dark',
        language: userSettings?.language ?? 'en'
      });

      return NextResponse.json({ success: true, message: 'PIN updated successfully' });
    } 
    // Jika hanya validasi PIN
    else if (currentPin) {
      // Dapatkan pengaturan pengguna
      const userSettings = await getUserSettings(userId);

      // Jika pengguna belum memiliki PIN
      if (!userSettings?.pin_hash) {
        return NextResponse.json({ error: 'PIN not set' }, { status: 404 });
      }

      // Hash PIN untuk perbandingan
      const pinHash = crypto.createHash('sha256').update(currentPin).digest('hex');
      
      // Periksa apakah PIN cocok
      if (pinHash !== userSettings.pin_hash) {
        return NextResponse.json({ error: 'Invalid PIN' }, { status: 401 });
      }

      return NextResponse.json({ success: true, message: 'PIN is valid' });
    } else {
      return NextResponse.json({ error: 'PIN is required' }, { status: 400 });
    }
  } catch (error) {
    console.error('Error updating/validating PIN:', error);
    return NextResponse.json({ error: 'Failed to process PIN' }, { status: 500 });
  }
} 