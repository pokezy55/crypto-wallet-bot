import { NextResponse } from 'next/server';
import { getWalletByUserId, getWalletTransactions, getRewardQuota, getTotalSwapUSDByWalletId, getExistingSwapClaim } from '@/lib/database';

export const dynamic = 'force-dynamic';

export async function GET(req, { params }) {
  try {
    const { userId } = params;
    // Get user wallet
    const wallet = await getWalletByUserId(userId);
    if (!wallet) return NextResponse.json({ error: 'Wallet not found' }, { status: 404 });
    // Ambil total swap USD dari database
    const totalSwapUSD = await getTotalSwapUSDByWalletId(wallet.id);
    // Cek status claim swap
    let status = 'unclaimed';
    if (totalSwapUSD >= 10) status = 'eligible';
    const existingClaims = await getExistingSwapClaim(userId);
    if (existingClaims.length > 0) {
      const claim = existingClaims[0];
      if (claim.status === 'processing') status = 'processing';
      if (claim.status === 'claimed') status = 'completed';
    }
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