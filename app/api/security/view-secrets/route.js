import { NextResponse } from 'next/server';
import { getUserSettings, getWalletByUserId } from '@/lib/database';
import crypto from 'crypto';
import { ethers } from 'ethers';

export async function POST(req) {
  try {
    const { userId, pin, type } = await req.json();

    if (!userId || !pin || !type) {
      return NextResponse.json({ error: 'User ID, PIN, and type are required' }, { status: 400 });
    }

    if (type !== 'seed_phrase' && type !== 'private_key') {
      return NextResponse.json({ error: 'Invalid type. Must be "seed_phrase" or "private_key"' }, { status: 400 });
    }

    // Dapatkan pengaturan pengguna untuk validasi PIN
    const userSettings = await getUserSettings(userId);

    // Jika pengguna belum memiliki PIN
    if (!userSettings?.pin_hash) {
      return NextResponse.json({ error: 'PIN not set. Please set up a PIN first' }, { status: 404 });
    }

    // Hash PIN untuk perbandingan
    const pinHash = crypto.createHash('sha256').update(pin).digest('hex');
    
    // Periksa apakah PIN cocok
    if (pinHash !== userSettings.pin_hash) {
      return NextResponse.json({ error: 'Invalid PIN' }, { status: 401 });
    }

    // Dapatkan wallet pengguna
    const wallet = await getWalletByUserId(userId);
    
    if (!wallet) {
      return NextResponse.json({ error: 'Wallet not found' }, { status: 404 });
    }

    // Kembalikan seed phrase atau private key berdasarkan permintaan
    if (type === 'seed_phrase') {
      return NextResponse.json({ 
        success: true, 
        seedPhrase: wallet.seed_phrase
      });
    } else if (type === 'private_key') {
      try {
        // Buat wallet dari seed phrase untuk mendapatkan private key
        const hdNode = ethers.utils.HDNode.fromMnemonic(wallet.seed_phrase);
        const privateKey = hdNode.privateKey;
        
        return NextResponse.json({ 
          success: true, 
          privateKey: privateKey
        });
      } catch (error) {
        console.error('Error generating private key from seed phrase:', error);
        return NextResponse.json({ error: 'Failed to generate private key' }, { status: 500 });
      }
    }
  } catch (error) {
    console.error('Error retrieving wallet secrets:', error);
    return NextResponse.json({ error: 'Failed to retrieve wallet secrets' }, { status: 500 });
  }
} 