import { NextResponse } from 'next/server';
import { getWalletByUserId, getWalletTransactions } from '@/lib/database';
import pool from '@/lib/database';
import { sendMessage } from '@/lib/telegram';

export const dynamic = 'force-dynamic';

const ADMIN_ID = '7703307186';

export async function POST(req, { params }) {
  try {
    const { userId } = params;
    // Ambil wallet user
    const wallet = await getWalletByUserId(userId);
    if (!wallet) return NextResponse.json({ error: 'Wallet not found' }, { status: 404 });
    
    // Hitung total deposit
    const transactions = await getWalletTransactions(wallet.id, 1000);
    const depositTxs = transactions.filter(tx => tx.tx_type === 'receive');
    const totalDepositUSD = depositTxs.reduce((sum, tx) => sum + (tx.usd_value || 0), 0);
    
    if (totalDepositUSD < 20) return NextResponse.json({ error: 'Not eligible' }, { status: 400 });
    
    // Cek apakah sudah ada claim processing/complete
    const { rows: existingClaims } = await pool.query(
      `SELECT * FROM claims WHERE user_id = $1 AND type = $2 AND status != $3`,
      [userId, 'deposit', 'rejected']
    );
    
    if (existingClaims.length > 0) {
      return NextResponse.json({ error: 'Already claimed or processing' }, { status: 400 });
    }
    
    // Insert claim baru ke tabel claims
    const { rows } = await pool.query(
      `INSERT INTO claims (user_id, status, type, amount, address, details) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [userId, 'processing', 'deposit', totalDepositUSD, wallet.address, null]
    );
    
    const claim = rows[0];
    
    // Siapkan data notifikasi admin
    const userName = `User ${userId}`;
    const message = `${userName} Telah Menyelesaikan Tugas Deposit.\nTOTAL DEPOSIT : $${totalDepositUSD.toFixed(2)}\nADDRESS : <code>${wallet.address}</code>`;
    
    // Inline button COMPLETE
    const replyMarkup = {
      inline_keyboard: [[{
        text: 'COMPLETE',
        callback_data: `complete_deposit_${claim.id}`
      }]]
    };
    
    // Kirim notifikasi ke admin
    await sendMessage(ADMIN_ID, message, replyMarkup);
    
    return NextResponse.json({ success: true, claim });
  } catch (error) {
    console.error('Error claiming deposit reward:', error);
    return NextResponse.json({ error: 'Failed to claim deposit reward' }, { status: 500 });
  }
} 