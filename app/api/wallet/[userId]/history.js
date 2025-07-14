import { NextResponse } from 'next/server'
import { getWalletByUserId } from '@/lib/database'
import { fetchTransactionHistory } from '@/lib/crypto-alchemy'

export const dynamic = 'force-dynamic'

const CHAINS = ['eth', 'polygon', 'bsc', 'base']

export async function GET(request, { params }) {
  try {
    const { userId } = params
    const walletData = await getWalletByUserId(userId)
    if (!walletData) {
      return NextResponse.json({ error: 'Wallet not found' }, { status: 404 })
    }
    const address = walletData.address
    // Fetch transaction history dari semua chain utama
    let history = []
    for (const chain of CHAINS) {
      const txs = await fetchTransactionHistory(address, chain)
      const formatted = txs.map(tx => {
        if (tx.category === 'external' && tx.from?.toLowerCase() === address.toLowerCase()) {
          return {
            type: 'Send',
            amount: tx.value,
            token: tx.asset,
            to: tx.to,
            txHash: tx.hash,
            chain
          }
        } else if (tx.category === 'external' && tx.to?.toLowerCase() === address.toLowerCase()) {
          return {
            type: 'Receive',
            amount: tx.value,
            token: tx.asset,
            from: tx.from,
            txHash: tx.hash,
            chain
          }
        } else if (tx.category === 'swap') {
          return {
            type: 'Swap',
            amountIn: tx.value,
            tokenIn: tx.asset,
            amountOut: tx.valueTo,
            tokenOut: tx.assetTo,
            txHash: tx.hash,
            chain
          }
        }
        return null
      }).filter(Boolean)
      history = history.concat(formatted)
    }
    return NextResponse.json({ history })
  } catch (error) {
    console.error('Error fetching wallet history:', error)
    return NextResponse.json({ error: 'Failed to fetch wallet history' }, { status: 500 })
  }
} 