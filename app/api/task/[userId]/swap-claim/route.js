import { NextResponse } from 'next/server';
import { getWalletByUserId, getWalletTransactions, getSwapClaims } from '@/lib/database';
import pool from '@/lib/database';
import { sendMessage } from '@/lib/telegram';

export const dynamic = 'force-dynamic';

const ADMIN_ID = '7703307186';

export async function POST(req, { params }) {
  try {
    const { userId } = params;
    // Get user wallet
    const wallet = await getWalletByUserId(userId);
    if (!wallet) return NextResponse.json({ error: 'Wallet not found' }, { status: 404 });
    // Calculate total swap
    const transactions = await getWalletTransactions(wallet.id, 1000);
    const swapTxs = transactions.filter(tx => tx.tx_type === 'swap');
    const totalSwapUSD = swapTxs.reduce((sum, tx) => sum + (tx.usd_value || 0), 0);
    if (totalSwapUSD < 10) return NextResponse.json({ error: 'Not eligible' }, { status: 400 });
    // Check if already claimed/processing
    const claims = await getSwapClaims();
    const existing = claims.find(c => c.user_id == userId && c.status !== 'rejected');
    if (existing) return NextResponse.json({ error: 'Already claimed or processing' }, { status: 400 });
    // Insert new claim to claims table
    const { rows } = await pool.query(
      `INSERT INTO claims (user_id, status, type, amount, address, details) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [userId, 'processing', 'swap', totalSwapUSD, wallet.address, null]
    );
    const claim = rows[0];
    // Prepare admin notification
    const userName = `User ${userId}`;
    const message = `${userName} Has Completed Swap Task.\nBALANCE: $${totalSwapUSD.toFixed(2)}\nADDRESS: <code>${wallet.address}</code>`;
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