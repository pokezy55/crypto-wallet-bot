import { NextResponse } from 'next/server';
import { getLastDepositProgress, getLastSwapProgress, updateDepositProgress, updateSwapProgress, addUserXP } from '@/lib/database';
import { getTotalBalanceUSD, getEvmSwapsUSD } from '@/lib/crypto-alchemy';

const NETWORKS = [
  { name: 'ethereum', chainId: 1 },
  { name: 'bsc', chainId: 56 },
  { name: 'polygon', chainId: 137 },
  { name: 'base', chainId: 8453 },
];

// Simple in-memory cache (userId: { deposit, swap, ts })
const cache = {};
const CACHE_TTL = 60 * 1000; // 1 menit

export const dynamic = 'force-dynamic';

export async function GET(req, { params }) {
  try {
    const { userId } = params;
    const now = Date.now();
    if (cache[userId] && now - cache[userId].ts < CACHE_TTL) {
      return NextResponse.json(cache[userId].result);
    }
    // --- Deposit ---
    let totalBalanceUSD = 0;
    for (const net of NETWORKS) {
      totalBalanceUSD += await getTotalBalanceUSD(userId, net.name);
    }
    let depositStatus = totalBalanceUSD >= 20 ? 'completed' : 'in_progress';
    // Update campaign_progress & XP jika status berubah
    const lastDeposit = await getLastDepositProgress(userId);
    if (!lastDeposit || lastDeposit.status !== depositStatus) {
      await updateDepositProgress(userId, totalBalanceUSD, depositStatus);
      if (depositStatus === 'completed' && lastDeposit?.status !== 'completed') {
        await addUserXP(userId, 10);
      }
    }
    // --- Swap ---
    let totalSwapUSD = 0;
    for (const net of NETWORKS) {
      totalSwapUSD += await getEvmSwapsUSD(userId, net.name);
    }
    let swapStatus = totalSwapUSD >= 10 ? 'completed' : 'in_progress';
    const lastSwap = await getLastSwapProgress(userId);
    if (!lastSwap || lastSwap.status !== swapStatus) {
      await updateSwapProgress(userId, totalSwapUSD, swapStatus);
      if (swapStatus === 'completed' && lastSwap?.status !== 'completed') {
        await addUserXP(userId, 10);
      }
    }
    const result = {
      deposit: {
        progress: `${totalBalanceUSD.toFixed(2)}/20`,
        status: depositStatus,
      },
      swap: {
        progress: `${totalSwapUSD.toFixed(2)}/10`,
        status: swapStatus,
      }
    };
    cache[userId] = { result, ts: now };
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching task status:', error);
    return NextResponse.json({ error: 'Failed to fetch task status' }, { status: 500 });
  }
} 