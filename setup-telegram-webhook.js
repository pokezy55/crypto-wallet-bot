const telegram = require('./lib/telegram');

async function setupTelegramWebhook() {
  try {
    console.log('🤖 Setting up Telegram Bot Webhook...\n');

    // Get current webhook info
    console.log('1️⃣ Checking current webhook status...');
    const webhookInfo = await telegram.getWebhookInfo();
    console.log('Current webhook:', webhookInfo.result.url || 'Not set');

    // Set webhook URL (ganti dengan domain kamu)
    const webhookUrl = 'https://your-domain.com/api/telegram/webhook'; // Ganti dengan domain kamu
    console.log(`\n2️⃣ Setting webhook to: ${webhookUrl}`);
    
    const result = await telegram.setWebhook(webhookUrl);
    
    if (result.ok) {
      console.log('✅ Webhook set successfully!');
      console.log('📋 Webhook details:', result.result);
    } else {
      console.log('❌ Failed to set webhook:', result.description);
    }

    // Verify webhook
    console.log('\n3️⃣ Verifying webhook...');
    const verifyInfo = await telegram.getWebhookInfo();
    console.log('Webhook status:', verifyInfo.result.url ? '✅ Active' : '❌ Not set');

    console.log('\n🎉 Telegram Bot setup completed!');
    console.log('\n📝 Next steps:');
    console.log('1. Test bot commands: /start, /wallet');
    console.log('2. Check webhook receives updates');
    console.log('3. Test WebApp integration');

  } catch (error) {
    console.error('❌ Telegram setup failed:', error.message);
    console.log('\n🔧 Troubleshooting:');
    console.log('1. Check TELEGRAM_BOT_TOKEN in .env.local');
    console.log('2. Make sure domain is accessible via HTTPS');
    console.log('3. Verify bot has webhook permissions');
  }
}

setupTelegramWebhook(); 