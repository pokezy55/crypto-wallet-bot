import { NextResponse } from 'next/server';
import { createUser, approveSwapClaim, approveDepositClaim } from '@/lib/database';
import fs from 'fs/promises';
import path from 'path';

export const dynamic = 'force-dynamic';

async function isUserBanned(userId) {
  try {
    const filePath = path.join(process.cwd(), 'banned.txt');
    const content = await fs.readFile(filePath, 'utf8').catch(() => '');
    return content.split('\n').includes(String(userId));
  } catch {
    return false;
  }
}

async function banUser(userId) {
  const filePath = path.join(process.cwd(), 'banned.txt');
  await fs.appendFile(filePath, `${userId}\n`, 'utf8');
}

export async function POST(req) {
  try {
    const data = await req.json();

    // Handler for COMPLETE swap claim button
    if (data.callback_query && data.callback_query.data) {
      const cb = data.callback_query;
      if (cb.data.startsWith('complete_swap_')) {
        const claimId = cb.data.replace('complete_swap_', '');
        await approveSwapClaim(claimId);
        // Reply to admin
        const chatId = cb.message.chat.id;
        const messageId = cb.message.message_id;
        // Edit message to mark as completed
        await fetch(`https://api.telegram.org/bot7350915669:AAHYKWL3URPNi0DtPDZZTmGTJXf3cse_Yak/editMessageReplyMarkup`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ chat_id: chatId, message_id: messageId, reply_markup: { inline_keyboard: [] } })
        });
        await fetch(`https://api.telegram.org/bot7350915669:AAHYKWL3URPNi0DtPDZZTmGTJXf3cse_Yak/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ chat_id: chatId, text: 'Claim marked as completed.' })
        });
        return NextResponse.json({ ok: true });
      }
      // Handler for COMPLETE deposit claim button
      else if (cb.data.startsWith('complete_deposit_')) {
        const claimId = cb.data.replace('complete_deposit_', '');
        await approveDepositClaim(claimId);
        // Reply to admin
        const chatId = cb.message.chat.id;
        const messageId = cb.message.message_id;
        // Edit message to mark as completed
        await fetch(`https://api.telegram.org/bot7350915669:AAHYKWL3URPNi0DtPDZZTmGTJXf3cse_Yak/editMessageReplyMarkup`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ chat_id: chatId, message_id: messageId, reply_markup: { inline_keyboard: [] } })
        });
        await fetch(`https://api.telegram.org/bot7350915669:AAHYKWL3URPNi0DtPDZZTmGTJXf3cse_Yak/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ chat_id: chatId, text: 'Deposit claim marked as completed.' })
        });
        return NextResponse.json({ ok: true });
      }
    }

    // Check if /ban user command
    if (data.message && data.message.text) {
      const text = data.message.text.trim();
      if (text.startsWith('/ban')) {
        const parts = text.split(' ');
        if (parts.length > 1) {
          const userToBan = parts[1];
          await banUser(userToBan);
          return NextResponse.json({ success: true, message: `User ${userToBan} banned.` });
        }
      }
    }

    // Check banned before other processes
    const userId = data.message?.from?.id || data.userId;
    if (userId && await isUserBanned(userId)) {
      return NextResponse.json({ error: 'User is banned' }, { status: 403 });
    }

    // If there's a /start message, insert user to database
    if (data.message && data.message.text && data.message.text.startsWith('/start')) {
      const from = data.message.from;
      if (from && from.id) {
        const userData = {
          id: from.id, // REQUIRED!
          username: from.username || null,
          first_name: from.first_name || null,
          last_name: from.last_name || null,
          photo_url: from.photo_url || null
        };
        await createUser(userData);
      } else {
        console.error('Telegram user id not found in message.from');
      }
      // Kirim pesan promosi + inline button
      const promoText = `Cointwo – Your Crypto Hub on Telegram!\n\nCointwo isn’t just a wallet — it’s a fast, secure, and gas-efficient crypto platform built for effortless transactions, all within Telegram.\n\nWhy Cointwo?\n🔒 <b>Fully non‑custodial</b> – Your keys, your crypto.\n⚡️ <b>Instant transfers & swaps</b> – Multi‑chain support: ETH, BSC, Polygon, Base.\n🎯 <b>Earn & grow</b> – Complete tasks, invite friends, and climb the leaderboard.\n📊 <b>Smart tracking</b> – Manage and monitor wallets across chains in one place.\n\n<b>Next‑Gen Protocol</b> – Redefining crypto usability where Telegram meets DeFi.\n\n💌 <b>Cointwo Links</b> – Send Crypto, Simplified!\nNo wallet? No problem. Share crypto via secure links — fast, private, and borderless.\n\nSwap, send, receive, and earn with Cointwo.\nThe next evolution of Telegram crypto wallets is here — built for everyone.`;
      const replyMarkup = {
        inline_keyboard: [
          [
            { text: 'My Wallet', url: 'https://t.me/cointwobot/wallet' }
          ],
          [
            { text: 'Channel', url: 'https://t.me/cointwo_en' }
          ]
        ]
      };
      await fetch(`https://api.telegram.org/bot7350915669:AAHYKWL3URPNi0DtPDZZTmGTJXf3cse_Yak/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: data.message.chat.id,
          text: promoText,
          parse_mode: 'HTML',
          reply_markup: replyMarkup
        })
      });
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Error processing webhook:', error);
    return NextResponse.json(
      { error: 'Failed to process webhook' },
      { status: 500 }
    );
  }
} 