import { NextResponse } from 'next/server';
import { createUser, getUserByTelegramId } from '@/lib/database';

export async function POST(req) {
  try {
    const update = await req.json();
    
    // Handle different types of updates
    if (update.message) {
      const message = update.message;
      const user = message.from;
      
      // Create or update user in database
      const dbUser = await createUser({
        id: user.id,
        username: user.username,
        first_name: user.first_name,
        last_name: user.last_name,
        photo_url: user.photo_url
      });
      
      // Handle commands
      if (message.text) {
        const text = message.text.toLowerCase();
        
        if (text === '/start') {
          // Send welcome message with WebApp button
          return NextResponse.json({
            method: 'sendMessage',
            chat_id: message.chat.id,
            text: 'Welcome to Crypto Wallet Bot! 🚀\n\nClick the button below to open your wallet:',
            reply_markup: {
              inline_keyboard: [[
                {
                  text: 'Open Wallet',
                  web_app: { url: `${process.env.NEXT_PUBLIC_APP_URL}?user=${user.id}` }
                }
              ]]
            }
          });
        }
        
        if (text === '/wallet') {
          // Check if user has wallet
          const wallet = await getUserByTelegramId(user.id);
          if (wallet) {
            return NextResponse.json({
              method: 'sendMessage',
              chat_id: message.chat.id,
              text: `Your wallet address: ${wallet.address}\n\nClick below to manage your wallet:`,
              reply_markup: {
                inline_keyboard: [[
                  {
                    text: 'Manage Wallet',
                    web_app: { url: `${process.env.NEXT_PUBLIC_APP_URL}?user=${user.id}` }
                  }
                ]]
              }
            });
          } else {
            return NextResponse.json({
              method: 'sendMessage',
              chat_id: message.chat.id,
              text: 'You don\'t have a wallet yet. Click below to create one:',
              reply_markup: {
                inline_keyboard: [[
                  {
                    text: 'Create Wallet',
                    web_app: { url: `${process.env.NEXT_PUBLIC_APP_URL}?user=${user.id}` }
                  }
                ]]
              }
            });
          }
        }
      }
    }
    
    // Default response
    return NextResponse.json({ ok: true });
    
  } catch (error) {
    console.error('Telegram webhook error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 