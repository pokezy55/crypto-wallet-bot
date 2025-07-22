import { NextResponse } from 'next/server';
import { getUserSettings, getWalletByUserId } from '@/lib/database';
import crypto from 'crypto';
import { Wallet } from 'ethers';

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
        // Menggunakan Wallet.fromPhrase yang sudah digunakan di codebase
        const ethersWallet = Wallet.fromPhrase(wallet.seed_phrase);
        
        if (!ethersWallet || !ethersWallet.privateKey) {
          console.error('Failed to generate private key: Wallet or privateKey is undefined');
          return NextResponse.json({ 
            error: 'Failed to generate private key from seed phrase', 
            details: 'Wallet or privateKey is undefined'
          }, { status: 500 });
        }
        
        const privateKey = ethersWallet.privateKey;
        
        // Pastikan privateKey memiliki format yang benar (0x diikuti oleh 64 karakter hex)
        if (!privateKey || !privateKey.match(/^0x[0-9a-fA-F]{64}$/)) {
          console.error('Invalid private key format:', privateKey ? privateKey.substring(0, 10) + '...' : 'undefined');
          return NextResponse.json({ 
            error: 'Invalid private key format', 
            details: 'Generated private key has incorrect format'
          }, { status: 500 });
        }
        
        return NextResponse.json({ 
          success: true, 
          privateKey: privateKey
        });
      } catch (error) {
        console.error('Error generating private key from seed phrase:', error);
        
        // Berikan pesan error yang lebih spesifik
        let errorMessage = 'Failed to generate private key';
        let errorDetails = error.message || 'Unknown error';
        
        if (error.message && error.message.includes('invalid mnemonic')) {
          errorMessage = 'Invalid seed phrase format';
          errorDetails = 'The seed phrase stored in the wallet is not valid';
        } else if (error.code === 'INVALID_ARGUMENT') {
          errorMessage = 'Invalid argument for private key generation';
          errorDetails = error.argument || 'Unknown argument';
        }
        
        return NextResponse.json({ 
          error: errorMessage, 
          details: errorDetails
        }, { status: 500 });
      }
    }
  } catch (error) {
    console.error('Error retrieving wallet secrets:', error);
    return NextResponse.json({ 
      error: 'Failed to retrieve wallet secrets',
      details: error.message || 'Unknown error'
    }, { status: 500 });
  }
} 