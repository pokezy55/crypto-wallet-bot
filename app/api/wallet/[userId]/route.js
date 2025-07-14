import { NextResponse } from 'next/server'
import { getWalletByUserId } from '@/lib/database'
import { fetchEthBalance, fetchErc20Balance } from '@/lib/crypto-alchemy'

const CHAINS = ['eth', 'polygon', 'bsc', 'base']
const NATIVE_SYMBOL = { eth: 'eth', polygon: 'pol', bsc: 'bnb', base: 'base' }
const ERC20_TOKENS = ['USDT']

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
    // Fetch balance dari semua chain utama
    const balances = {}
    for (const chain of CHAINS) {
      balances[chain] = {}
      // Native token
      const nativeSymbol = NATIVE_SYMBOL[chain]
      balances[chain][nativeSymbol] = (await fetchEthBalance(address, chain)).toString()
      // ERC20 tokens
      for (const symbol of ERC20_TOKENS) {
        balances[chain][symbol.toLowerCase()] = (await fetchErc20Balance(address, symbol, chain)).toString()
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