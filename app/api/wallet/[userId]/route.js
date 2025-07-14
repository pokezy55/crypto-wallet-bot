import { NextResponse } from 'next/server'
import { getWalletByUserId } from '@/lib/database'

export async function GET(request, { params }) {
  try {
    const { userId } = params
    const walletData = await getWalletByUserId(userId)
    if (!walletData) {
      return NextResponse.json(
        { error: 'Wallet not found' },
        { status: 404 }
      )
    }
    // Format wallet data
    const wallet = {
      id: walletData.id?.toString(),
      address: walletData.address,
      seedPhrase: walletData.seed_phrase,
      balance: {
        eth: walletData.balance_eth || '0.0',
        usdt: walletData.balance_usdt || '0.00',
        bnb: walletData.balance_bnb || '0.0',
        pol: walletData.balance_pol || '0.0',
        base: walletData.balance_base || '0.0'
      },
      createdAt: walletData.created_at,
      updatedAt: walletData.updated_at
    }
    return NextResponse.json(wallet)
  } catch (error) {
    console.error('Error getting wallet:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 