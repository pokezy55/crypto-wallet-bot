const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_API_URL = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}`;

// Send message to user
async function sendMessage(chatId, text, replyMarkup = null) {
  try {
    const response = await fetch(`${TELEGRAM_API_URL}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: text,
        parse_mode: 'HTML',
        reply_markup: replyMarkup
      })
    });
    
    return await response.json();
  } catch (error) {
    console.error('Error sending Telegram message:', error);
    throw error;
  }
}

// Set webhook URL
async function setWebhook(url) {
  try {
    const response = await fetch(`${TELEGRAM_API_URL}/setWebhook`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url })
    });
    
    return await response.json();
  } catch (error) {
    console.error('Error setting webhook:', error);
    throw error;
  }
}

// Get webhook info
async function getWebhookInfo() {
  try {
    const response = await fetch(`${TELEGRAM_API_URL}/getWebhookInfo`);
    return await response.json();
  } catch (error) {
    console.error('Error getting webhook info:', error);
    throw error;
  }
}

// Send notification to user
async function sendNotification(userId, message) {
  try {
    return await sendMessage(userId, message);
  } catch (error) {
    console.error('Error sending notification:', error);
    throw error;
  }
}

// Send wallet notification
async function sendWalletNotification(userId, walletAddress, balance) {
  const message = `
💰 <b>Wallet Update</b>

Address: <code>${walletAddress}</code>
Balance: ${balance.eth} ETH | $${balance.usdt} USDT

<a href="${process.env.NEXT_PUBLIC_APP_URL}?user=${userId}">Open Wallet</a>
  `;
  
  return await sendMessage(userId, message);
}

// Send task completion notification
async function sendTaskNotification(userId, taskDescription, reward) {
  const message = `
🎉 <b>Task Completed!</b>

Task: ${taskDescription}
Reward: $${reward} USDT

<a href="${process.env.NEXT_PUBLIC_APP_URL}?user=${userId}">Claim Reward</a>
  `;
  
  return await sendMessage(userId, message);
}

// Send referral notification
async function sendReferralNotification(userId, referredUsername, reward) {
  const message = `
👥 <b>New Referral!</b>

User: @${referredUsername}
Reward: $${reward} USDT

<a href="${process.env.NEXT_PUBLIC_APP_URL}?user=${userId}">View Referrals</a>
  `;
  
  return await sendMessage(userId, message);
}

module.exports = {
  sendMessage,
  setWebhook,
  getWebhookInfo,
  sendNotification,
  sendWalletNotification,
  sendTaskNotification,
  sendReferralNotification
}; 