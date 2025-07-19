import { NextResponse } from 'next/server'
import { createWallet, getWalletByUserId, getUserById, createUser } from '@/lib/database'
import { Wallet } from 'ethers'

// Validate seed phrase format
function validateSeedPhrase(phrase: string): boolean {
  try {
    // Clean seed phrase
    const cleanPhrase = phrase.trim().replace(/\s+/g, ' ').replace(/^0x/, '');
    
    // Check word count
    const words = cleanPhrase.split(' ');
    if (words.length !== 12) {
      throw new Error('Seed phrase must contain exactly 12 words');
    }

    // Validate each word
    for (const word of words) {
      if (word.length < 3) {
        throw new Error('Invalid word in seed phrase');
      }
      if (!/^[a-zA-Z]+$/.test(word)) {
        throw new Error('Seed phrase can only contain letters');
      }
    }

    // Try creating wallet to validate
    const wallet = Wallet.fromPhrase(cleanPhrase);
    console.log('Validated wallet address:', wallet.address);
    return true;
  } catch (error) {
    console.error('Seed phrase validation error:', error);
    return false;
  }
}

interface CreateWalletRequest {
  userId: number;
  address: string;
  seedPhrase: string;
}

export async function POST(request: Request) {
  try {
    console.log('Creating new wallet...');
    
    const { userId, address, seedPhrase } = await request.json() as CreateWalletRequest;
    
    // Validate required fields
    if (!userId || !address || !seedPhrase) {
      console.error('Missing required fields:', { userId: !!userId, address: !!address, seedPhrase: !!seedPhrase });
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Validate seed phrase format
    if (!validateSeedPhrase(seedPhrase)) {
      console.error('Invalid seed phrase format');
      return NextResponse.json(
        { error: 'Invalid seed phrase format' },
        { status: 400 }
      )
    }

    // Clean seed phrase
    const cleanSeedPhrase = seedPhrase.trim().replace(/\s+/g, ' ').replace(/^0x/, '');

    // Check if user already has a wallet
    console.log('Checking existing wallet for user:', userId);
    const existingWallet = await getWalletByUserId(userId)
    if (existingWallet) {
      console.log('User already has a wallet:', existingWallet.address);
      return NextResponse.json(
        { error: 'User already has a wallet' },
        { status: 409 }
      )
    }

    // Check if user exists, if not, create minimal user
    console.log('Checking user existence:', userId);
    let user = await getUserById(userId)
    if (!user) {
      console.log('Creating new user:', userId);
      await createUser({ id: userId })
    }

    // Create new wallet
    console.log('Creating wallet for user:', userId);
    const wallet = await createWallet(userId, {
      address,
      seedPhrase: cleanSeedPhrase,
      balance_eth: '0.0',
      balance_usdt: '0.00',
      balance_bnb: '0.0',
      balance_pol: '0.0',
      balance_base: '0.0'
    })

    console.log('Wallet created successfully:', wallet.address);

    // Return success response
    return NextResponse.json({
      success: true,
      id: wallet.id?.toString(),
      address: wallet.address,
      seedPhrase: cleanSeedPhrase, // Include seed phrase in response
      message: 'Wallet created successfully'
    })
  } catch (error) {
    console.error('Error creating wallet:', error)
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    )
  }
} 