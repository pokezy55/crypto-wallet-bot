import { NextResponse } from 'next/server';
import { getWalletByUserId, getWalletTransactions, getRewardQuota } from '@/lib/database';

export const dynamic = 'force-dynamic';

export async function GET(req, { params }) {
  try {
    const { userId } = params;
    // Get user wallet
    const wallet = await getWalletByUserId(userId);
    if (!wallet) return NextResponse.json({ error: 'Wallet not found' }, { status: 404 });
    // Get swap transactions
    const transactions = await getWalletTransactions(wallet.id, 1000);
    const swapTxs = transactions.filter(tx => tx.tx_type === 'swap');
    const totalSwapUSD = swapTxs.reduce((sum, tx) => sum + (tx.usd_value || 0), 0);
    // Claim status: processing/claimed/unclaimed
    let status = 'unclaimed';
    if (totalSwapUSD >= 10) status = 'eligible';
    // Ambil quota dari database
    const quota = await getRewardQuota('swap');
    return NextResponse.json({ 
      totalSwapUSD, 
      eligibleToClaim: totalSwapUSD >= 10, 
      status,
      target: 10,
      progress: Math.min(100, (totalSwapUSD / 10) * 100),
      rewardQuotaTotal: quota?.total ?? 4000,
      rewardQuotaRemaining: quota?.remaining ?? 4000,
    });
  } catch (error) {
    console.error('Error fetching swap progress:', error);
    return NextResponse.json({ error: 'Failed to fetch swap progress' }, { status: 500 });
  }
} 