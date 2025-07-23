import { NextResponse } from 'next/server';
import { getWalletByUserId, getWalletTransactions } from '@/lib/database';

export const dynamic = 'force-dynamic';

export async function GET(req, { params }) {
  try {
    const { userId } = params;
    // Get user wallet
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
      // tambahkan field lain jika ada jaringan/token lain
    ];
    const totalDepositUSD = nativeAndStableBalances.reduce((a, b) => a + b, 0);
    let status = 'unclaimed';
    if (totalDepositUSD >= 20) status = 'eligible';
    return NextResponse.json({ 
      totalDepositUSD, 
      eligibleToClaim: totalDepositUSD >= 20, 
      status,
      target: 20,
      progress: Math.min(100, (totalDepositUSD / 20) * 100),
      rewardQuotaTotal: 4000,
      rewardQuotaRemaining: 4000
    });
  } catch (error) {
    console.error('Error fetching deposit progress:', error);
    return NextResponse.json({ error: 'Failed to fetch deposit progress' }, { status: 500 });
  }
} 