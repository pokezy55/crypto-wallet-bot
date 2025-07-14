import { NextResponse } from 'next/server';
import { getWalletByUserId, getWalletTransactions } from '@/lib/database';

export const dynamic = 'force-dynamic';

export async function GET(req, { params }) {
  try {
    const { userId } = params;
    // Ambil wallet user
    const wallet = await getWalletByUserId(userId);
    if (!wallet) return NextResponse.json({ error: 'Wallet not found' }, { status: 404 });
    // Ambil transaksi swap
    const transactions = await getWalletTransactions(wallet.id, 1000);
    const swapTxs = transactions.filter(tx => tx.tx_type === 'swap');
    const totalSwapUSD = swapTxs.reduce((sum, tx) => sum + (tx.usd_value || 0), 0);
    // Status claim: processing/claimed/belum
    // (Dummy, nanti bisa diambil dari tabel task/claim)
    let status = 'unclaimed';
    // TODO: Integrasi dengan status task/claim swap user
    if (totalSwapUSD >= 10) status = 'eligible';
    return NextResponse.json({ totalSwapUSD, eligibleToClaim: totalSwapUSD >= 10, status });
  } catch (error) {
    console.error('Error fetching swap progress:', error);
    return NextResponse.json({ error: 'Failed to fetch swap progress' }, { status: 500 });
  }
} 