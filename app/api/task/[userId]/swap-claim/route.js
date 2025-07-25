import { NextResponse } from 'next/server';
import { getWalletByUserId, decrementRewardQuota, getTotalSwapUSDByWalletId, getExistingSwapClaim, createSwapClaim } from '@/lib/database';
import pool from '@/lib/database';
import { sendMessage } from '@/lib/telegram';

export const dynamic = 'force-dynamic';

const ADMIN_ID = '7703307186';

export async function POST(req, { params }) {
  try {
    const { userId } = params;
    const wallet = await getWalletByUserId(userId);
    if (!wallet) return NextResponse.json({ error: 'Wallet not found' }, { status: 404 });

    // Ambil total swap dari kolom total_swap di tabel wallets
    const totalSwapUSD = await getTotalSwapUSDByWalletId(wallet.id);
    if (totalSwapUSD < 10) return NextResponse.json({ error: 'Not eligible' }, { status: 400 });

    // Kurangi quota swap
    const quota = await decrementRewardQuota('swap');
    if (!quota) {
      return NextResponse.json({ error: 'Reward quota exhausted' }, { status: 400 });
    }

    // Check if there's already a claim processing/complete
    const existingClaims = await getExistingSwapClaim(userId);
    if (existingClaims.length > 0) {
      return NextResponse.json({ error: 'Already claimed or processing' }, { status: 400 });
    }

    // Insert new claim to claims table
    const claim = await createSwapClaim(userId, wallet, totalSwapUSD);

    // Prepare admin notification data
    const userName = `User ${userId}`;
    const message = `${userName} Has Completed Swap Task.\nTOTAL SWAP: $${totalSwapUSD.toFixed(2)}\nADDRESS: <code>${wallet.address}</code>`;

    // Inline button COMPLETE
    const replyMarkup = {
      inline_keyboard: [[{
        text: 'COMPLETE',
        callback_data: `complete_swap_${claim.id}`
      }]]
    };

    // Send notification to admin
    await sendMessage(ADMIN_ID, message, replyMarkup);

    return NextResponse.json({ success: true, claim });
  } catch (error) {
    console.error('Error claiming swap:', error);
    return NextResponse.json({ error: 'Failed to claim swap' }, { status: 500 });
  }
} 