import { NextResponse } from 'next/server'
import { createWallet, getWalletByUserId } from '@/lib/database'

export async function POST(request) {
  try {
    const { userId, address, seedPhrase } = await request.json()
    // Validate required fields
    if (!userId || !address || !seedPhrase) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }
    // Check if user already has a wallet
    const existingWallet = await getWalletByUserId(userId)
    if (existingWallet) {
      return NextResponse.json(
        { error: 'User already has a wallet' },
        { status: 409 }
      )
    }
    // Create new wallet
    const wallet = await createWallet(userId, {
      address,
      seedPhrase,
      balance_eth: '0.0',
      balance_usdt: '0.00',
      balance_bnb: '0.0',
      balance_pol: '0.0',
      balance_base: '0.0'
    })
    // Return success response
    return NextResponse.json({
      success: true,
      id: wallet.id?.toString(),
      address: wallet.address,
      message: 'Wallet created successfully'
    })
  } catch (error) {
    console.error('Error creating wallet:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 