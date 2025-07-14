import { NextResponse } from 'next/server'
import { getWalletByUserId } from '@/lib/database'
import { fetchTransactionHistory } from '@/lib/crypto-alchemy'

export const dynamic = 'force-dynamic'

export async function GET(request, { params }) {
  try {
    const { userId } = params
    const walletData = await getWalletByUserId(userId)
    if (!walletData) {
      return NextResponse.json({ error: 'Wallet not found' }, { status: 404 })
    }
    const address = walletData.address
    // Fetch transaction history dari blockchain
    const txs = await fetchTransactionHistory(address)
    // Format: Send, Receive, Swap
    const history = txs.map(tx => {
      if (tx.category === 'external' && tx.from?.toLowerCase() === address.toLowerCase()) {
        return {
          type: 'Send',
          amount: tx.value,
          token: tx.asset,
          to: tx.to,
          txHash: tx.hash
        }
      } else if (tx.category === 'external' && tx.to?.toLowerCase() === address.toLowerCase()) {
        return {
          type: 'Receive',
          amount: tx.value,
          token: tx.asset,
          from: tx.from,
          txHash: tx.hash
        }
      } else if (tx.category === 'swap') {
        return {
          type: 'Swap',
          amountIn: tx.value,
          tokenIn: tx.asset,
          amountOut: tx.valueTo,
          tokenOut: tx.assetTo,
          txHash: tx.hash
        }
      }
      return null
    }).filter(Boolean)
    return NextResponse.json({ history })
  } catch (error) {
    console.error('Error fetching wallet history:', error)
    return NextResponse.json({ error: 'Failed to fetch wallet history' }, { status: 500 })
  }
} 