import { NextResponse } from 'next/server';
import { createUserSettings, getUserSettings } from '@/lib/database';

export async function POST(req) {
  try {
    const { userId, notificationsEnabled, theme, highPerformanceMode } = await req.json();

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    // Dapatkan pengaturan pengguna saat ini
    const currentSettings = await getUserSettings(userId);

    // Simpan preferensi baru
    await createUserSettings(userId, {
      pinHash: currentSettings?.pin_hash || null,
      notificationsEnabled: notificationsEnabled !== undefined ? notificationsEnabled : currentSettings?.notifications_enabled || true,
      theme: theme || currentSettings?.theme || 'dark',
      // Untuk highPerformanceMode, kita akan menyimpannya di kolom yang sama dengan preferensi lain
      // dalam format JSON untuk menghindari perubahan skema database
      preferences: JSON.stringify({
        ...(currentSettings?.preferences ? JSON.parse(currentSettings.preferences) : {}),
        highPerformanceMode: highPerformanceMode !== undefined ? highPerformanceMode : 
          (currentSettings?.preferences ? 
            JSON.parse(currentSettings.preferences)?.highPerformanceMode || false : 
            false)
      })
    });

    return NextResponse.json({ 
      success: true, 
      message: 'Preferences updated successfully',
      preferences: {
        notificationsEnabled: notificationsEnabled !== undefined ? notificationsEnabled : currentSettings?.notifications_enabled || true,
        theme: theme || currentSettings?.theme || 'dark',
        highPerformanceMode: highPerformanceMode !== undefined ? highPerformanceMode : 
          (currentSettings?.preferences ? 
            JSON.parse(currentSettings.preferences)?.highPerformanceMode || false : 
            false)
      }
    });
  } catch (error) {
    console.error('Error updating preferences:', error);
    return NextResponse.json({ error: 'Failed to update preferences' }, { status: 500 });
  }
} 