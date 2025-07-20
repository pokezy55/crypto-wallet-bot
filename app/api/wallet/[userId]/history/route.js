import { NextResponse } from 'next/server'
import { getWalletByUserId } from '@/lib/database'
import { fetchTransactionHistory } from '@/lib/crypto-alchemy'

export const dynamic = 'force-dynamic'

const CHAINS = ['eth', 'polygon', 'bsc', 'base']

// Generate dummy transaction history
const generateDummyHistory = (userId) => {
  const now = Date.now();
  const day = 24 * 60 * 60 * 1000;
  
  return [
    {
      type: 'Receive',
      amount: '0.1',
      token: 'ETH',
      from: '0x' + '1'.repeat(40),
      txHash: '0x' + '1'.repeat(64),
      chain: 'eth',
      timestamp: new Date(now - 2 * day).toISOString()
    },
    {
      type: 'Send',
      amount: '0.05',
      token: 'ETH',
      to: '0x' + '2'.repeat(40),
      txHash: '0x' + '2'.repeat(64),
      chain: 'eth',
      timestamp: new Date(now - day).toISOString()
    },
    {
      type: 'Swap',
      amountIn: '0.02',
      tokenIn: 'ETH',
      amountOut: '50',
      tokenOut: 'USDT',
      txHash: '0x' + '3'.repeat(64),
      chain: 'eth',
      timestamp: new Date(now - 0.5 * day).toISOString()
    },
    {
      type: 'Receive',
      amount: '0.2',
      token: 'BNB',
      from: '0x' + '4'.repeat(40),
      txHash: '0x' + '4'.repeat(64),
      chain: 'bsc',
      timestamp: new Date(now - 0.2 * day).toISOString()
    }
  ];
};

export async function GET(request, { params }) {
  try {
    const { userId } = params
    
    // Return dummy history data
    console.log('Returning dummy history for user:', userId);
    return NextResponse.json({ 
      history: generateDummyHistory(userId) 
    });
    
    /* Original implementation commented out
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
    */
  } catch (error) {
    console.error('Error fetching wallet history:', error)
    
    // Return dummy history data on error
    return NextResponse.json({ 
      history: generateDummyHistory(params.userId || 12345) 
    });
  }
} 