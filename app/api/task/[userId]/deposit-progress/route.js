import { NextResponse } from 'next/server';
import { getWalletByUserId, getWalletTransactions } from '@/lib/database';

export const dynamic = 'force-dynamic';

export async function GET(req, { params }) {
  try {
    const { userId } = params;
    // Get user wallet
    const wallet = await getWalletByUserId(userId);
    if (!wallet) return NextResponse.json({ error: 'Wallet not found' }, { status: 404 });
    
    // Get deposit transactions (receive)
    const transactions = await getWalletTransactions(wallet.id, 1000);
    const depositTxs = transactions.filter(tx => tx.tx_type === 'receive');
    const totalDepositUSD = depositTxs.reduce((sum, tx) => sum + (tx.usd_value || 0), 0);
    
    // Claim status: processing/claimed/unclaimed
    let status = 'unclaimed';
    // TODO: Integrate with task/claim deposit status
    if (totalDepositUSD >= 20) status = 'eligible';
    
    return NextResponse.json({ 
      totalDepositUSD, 
      eligibleToClaim: totalDepositUSD >= 20, 
      status,
      target: 20,
      progress: Math.min(100, (totalDepositUSD / 20) * 100)
    });
  } catch (error) {
    console.error('Error fetching deposit progress:', error);
    return NextResponse.json({ error: 'Failed to fetch deposit progress' }, { status: 500 });
  }
} 