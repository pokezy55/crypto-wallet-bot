import { NextResponse } from 'next/server';
import { getWalletByUserId, getWalletTransactions } from '@/lib/database';

export const dynamic = 'force-dynamic';

export async function GET(req, { params }) {
  try {
    const { userId } = params;
    // Get user wallet
    const wallet = await getWalletByUserId(userId);
    if (!wallet) return NextResponse.json({ error: 'Wallet not found' }, { status: 404 });
    
    // Ambil saldo USDT dari wallet
    const usdtBalance = parseFloat(wallet.balance_usdt || '0');
    
    // Claim status: processing/claimed/unclaimed
    let status = 'unclaimed';
    if (usdtBalance >= 20) status = 'eligible';
    
    return NextResponse.json({ 
      totalDepositUSD: usdtBalance, 
      eligibleToClaim: usdtBalance >= 20, 
      status,
      target: 20,
      progress: Math.min(100, (usdtBalance / 20) * 100),
      rewardQuotaTotal: 4000,
      rewardQuotaRemaining: 3723
    });
  } catch (error) {
    console.error('Error fetching deposit progress:', error);
    return NextResponse.json({ error: 'Failed to fetch deposit progress' }, { status: 500 });
  }
} 