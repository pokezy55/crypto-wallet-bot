import { NextResponse } from 'next/server';
import { getWalletByUserId, decrementRewardQuota, getWalletTransactions, getExistingDepositClaim, createDepositClaim } from '@/lib/database';
// import pool from '@/lib/database'; // Dihapus karena tidak digunakan
import { sendMessage } from '@/lib/telegram';

export const dynamic = 'force-dynamic';

const ADMIN_ID = '7703307186';

export async function POST(req, { params }) {
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

    // Cek eligibility
    if (totalDepositUSD < 20) {
      return NextResponse.json({ error: 'Not eligible' }, { status: 400 });
    }

    // Kurangi quota deposit
    const quota = await decrementRewardQuota('deposit');
    if (!quota) {
      return NextResponse.json({ error: 'Reward quota exhausted' }, { status: 400 });
    }

    // Check if there's already a claim processing/complete
    const existingClaims = await getExistingDepositClaim(userId);
    if (existingClaims.length > 0) {
      return NextResponse.json({ error: 'Already claimed or processing' }, { status: 400 });
    }

    // Insert new claim to claims table
    const claim = await createDepositClaim(userId, wallet, totalDepositUSD);

    // Prepare admin notification data
    const userName = `User ${userId}`;
    const message = `${userName} Has Completed Deposit Task.\nTOTAL DEPOSIT: $${totalDepositUSD.toFixed(2)}\nADDRESS: <code>${wallet.address}</code>`;

    // Inline button COMPLETE
    const replyMarkup = {
      inline_keyboard: [[{
        text: 'COMPLETE',
        callback_data: `complete_deposit_${claim.id}`
      }]]
    };

    // Send notification to admin
    await sendMessage(ADMIN_ID, message, replyMarkup);

    return NextResponse.json({ success: true, claim });
  } catch (error) {
    console.error('Error in deposit-claim:', error);
    return NextResponse.json({ error: 'Failed to claim deposit reward' }, { status: 500 });
  }
} 