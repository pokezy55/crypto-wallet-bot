import { NextResponse } from 'next/server';
import { createUserSettings, getUserSettings } from '@/lib/database';
import crypto from 'crypto';

export async function POST(req) {
  try {
    const { userId, currentPin, newPin } = await req.json();

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    // Dapatkan pengaturan pengguna saat ini
    const userSettings = await getUserSettings(userId);
    const hasPinSet = !!userSettings?.pin_hash;

    // Jika mengubah PIN (bukan hanya validasi)
    if (newPin) {
      // Validasi format PIN baru
      if (!/^\d{4}$/.test(newPin)) {
        return NextResponse.json({ error: 'PIN must be 4 digits' }, { status: 400 });
      }

      // Jika pengguna sudah memiliki PIN, validasi PIN lama
      if (hasPinSet && currentPin) {
        // Hash PIN saat ini untuk perbandingan
        const currentPinHash = crypto.createHash('sha256').update(currentPin).digest('hex');
        
        // Periksa apakah PIN saat ini cocok
        if (currentPinHash !== userSettings.pin_hash) {
          return NextResponse.json({ error: 'Current PIN is incorrect' }, { status: 401 });
        }
      } else if (hasPinSet && !currentPin) {
        // Jika pengguna sudah memiliki PIN tapi tidak memberikan PIN lama
        return NextResponse.json({ error: 'Current PIN is required' }, { status: 400 });
      }
      // Jika pengguna belum memiliki PIN, tidak perlu validasi PIN lama

      // Hash PIN baru
      const newPinHash = crypto.createHash('sha256').update(newPin).digest('hex');

      // Simpan PIN baru
      const updatedSettings = await createUserSettings(userId, {
        pinHash: newPinHash,
        notificationsEnabled: userSettings?.notifications_enabled ?? true,
        theme: userSettings?.theme ?? 'dark',
        lockOnLoad: userSettings?.lockOnLoad ?? false,
        highPerformanceMode: userSettings?.preferences ? 
          JSON.parse(userSettings.preferences)?.highPerformanceMode || false : 
          false
      });

      return NextResponse.json({ 
        success: true, 
        message: 'PIN updated successfully',
        hasPinSet: true,
        lockOnLoad: updatedSettings?.lockOnLoad || false
      });
    } 
    // Jika hanya validasi PIN
    else if (currentPin) {
      // Jika pengguna belum memiliki PIN
      if (!hasPinSet) {
        return NextResponse.json({ error: 'PIN not set', hasPinSet: false }, { status: 404 });
      }

      // Hash PIN untuk perbandingan
      const pinHash = crypto.createHash('sha256').update(currentPin).digest('hex');
      
      // Periksa apakah PIN cocok
      if (pinHash !== userSettings.pin_hash) {
        return NextResponse.json({ error: 'Invalid PIN' }, { status: 401 });
      }

      return NextResponse.json({ 
        success: true, 
        message: 'PIN is valid',
        hasPinSet: true,
        lockOnLoad: userSettings?.lockOnLoad || false
      });
    } else {
      // Jika hanya memeriksa status PIN
      return NextResponse.json({ 
        success: true,
        hasPinSet: hasPinSet,
        lockOnLoad: userSettings?.lockOnLoad || false
      });
    }
  } catch (error) {
    console.error('Error updating/validating PIN:', error);
    return NextResponse.json({ error: 'Failed to process PIN' }, { status: 500 });
  }
} 