import { NextResponse } from 'next/server';
import { getWalletByUserId, getRewardQuota } from '@/lib/database';

export const dynamic = 'force-dynamic';

export async function GET(req, { params }) {
  try {
    const { userId } = params;
    const wallet = await getWalletByUserId(userId);
    if (!wallet) return NextResponse.json({ error: 'Wallet not found' }, { status: 404 });

    // Akumulasi saldo semua token native, USDT, dan USDC di semua jaringan default
    const nativeAndStableBalances = [
      parseFloat(wallet.balance_eth || '0'),
      parseFloat(wallet.balance_bnb || '0'),
      parseFloat(wallet.balance_pol || '0'),
      parseFloat(wallet.balance_base || '0'),
      parseFloat(wallet.balance_usdt || '0'),
      parseFloat(wallet.balance_usdc || '0'),
    ];
    const totalDepositUSD = nativeAndStableBalances.reduce((a, b) => a + b, 0);

    let status = 'unclaimed';
    if (totalDepositUSD >= 20) status = 'eligible';

    // Ambil quota dari database
    const quota = await getRewardQuota('deposit');

    return NextResponse.json({
      totalDepositUSD,
      eligibleToClaim: totalDepositUSD >= 20,
      status,
      target: 20,
      progress: Math.min(100, (totalDepositUSD / 20) * 100),
      rewardQuotaTotal: quota?.total ?? 4000,
      rewardQuotaRemaining: quota?.remaining ?? 4000,
    });
  } catch (error) {
    console.error('Error fetching deposit progress:', error);
    return NextResponse.json({ error: 'Failed to fetch deposit progress' }, { status: 500 });
  }
} 