import { NextResponse } from 'next/server'
import { getWalletByUserId } from '@/lib/database'
import { fetchEthBalance, fetchErc20Balance } from '@/lib/crypto-alchemy'

const TOKENS = [
  { symbol: 'ETH' },
  { symbol: 'USDT' },
  { symbol: 'BNB' },
  { symbol: 'POL' },
  { symbol: 'BASE' }
]

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
    const address = walletData.address
    // Fetch balance real-time dari blockchain
    const balances = {}
    for (const t of TOKENS) {
      if (t.symbol === 'ETH') {
        balances.eth = (await fetchEthBalance(address)).toString()
      } else {
        balances[t.symbol.toLowerCase()] = (await fetchErc20Balance(address, t.symbol)).toString()
      }
    }
    // Format wallet data
    const wallet = {
      id: walletData.id?.toString(),
      address: walletData.address,
      seedPhrase: walletData.seed_phrase,
      balance: balances,
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