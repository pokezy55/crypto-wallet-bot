import { NextResponse } from 'next/server';
import { getWalletByUserId, getWalletTransactions } from '@/lib/database';

export const dynamic = 'force-dynamic';

export async function GET(req, { params }) {
  try {
    const { userId } = params;
    // Ambil wallet user
    const wallet = await getWalletByUserId(userId);
    if (!wallet) return NextResponse.json({ error: 'Wallet not found' }, { status: 404 });
    
    // Ambil transaksi deposit (receive)
    const transactions = await getWalletTransactions(wallet.id, 1000);
    const depositTxs = transactions.filter(tx => tx.tx_type === 'receive');
    const totalDepositUSD = depositTxs.reduce((sum, tx) => sum + (tx.usd_value || 0), 0);
    
    // Status claim: processing/claimed/belum
    let status = 'unclaimed';
    // TODO: Integrasi dengan status task/claim deposit user
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