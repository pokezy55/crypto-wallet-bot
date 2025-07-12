const { Client } = require('pg');

// Database connection
const client = new Client({
  host: 'localhost',
  port: 5432,
  database: 'crypto_wallet_bot',
  user: 'postgres',
  password: 'Bandung123'
});

// Connect to database
async function connectDB() {
  if (!client._connected) {
    await client.connect();
  }
  return client;
}

// User operations
async function createUser(userData) {
  const db = await connectDB();
  const { rows } = await db.query(`
    INSERT INTO users (telegram_id, username, first_name, last_name, photo_url)
    VALUES ($1, $2, $3, $4, $5)
    ON CONFLICT (telegram_id) 
    DO UPDATE SET 
      username = EXCLUDED.username,
      first_name = EXCLUDED.first_name,
      last_name = EXCLUDED.last_name,
      photo_url = EXCLUDED.photo_url,
      updated_at = CURRENT_TIMESTAMP
    RETURNING *
  `, [userData.id, userData.username, userData.first_name, userData.last_name, userData.photo_url]);
  
  return rows[0];
}

async function getUserByTelegramId(telegramId) {
  const db = await connectDB();
  const { rows } = await db.query('SELECT * FROM users WHERE telegram_id = $1', [telegramId]);
  return rows[0];
}

// Wallet operations
async function createWallet(userId, walletData) {
  const db = await connectDB();
  const { rows } = await db.query(`
    INSERT INTO wallets (user_id, address, seed_phrase_encrypted, private_key_encrypted)
    VALUES ($1, $2, $3, $4)
    RETURNING *
  `, [userId, walletData.address, walletData.seedPhraseEncrypted, walletData.privateKeyEncrypted]);
  
  return rows[0];
}

async function getWalletByUserId(userId) {
  const db = await connectDB();
  const { rows } = await db.query(`
    SELECT w.*, u.telegram_id, u.username 
    FROM wallets w 
    JOIN users u ON w.user_id = u.id 
    WHERE w.user_id = $1
  `, [userId]);
  return rows[0];
}

async function getWalletByAddress(address) {
  const db = await connectDB();
  const { rows } = await db.query('SELECT * FROM wallets WHERE address = $1', [address]);
  return rows[0];
}

// Balance operations
async function updateBalance(walletId, tokenSymbol, amount, usdValue) {
  const db = await connectDB();
  const { rows } = await db.query(`
    INSERT INTO balances (wallet_id, token_symbol, amount, usd_value)
    VALUES ($1, $2, $3, $4)
    ON CONFLICT (wallet_id, token_symbol) 
    DO UPDATE SET 
      amount = EXCLUDED.amount,
      usd_value = EXCLUDED.usd_value,
      last_updated = CURRENT_TIMESTAMP
    RETURNING *
  `, [walletId, tokenSymbol, amount, usdValue]);
  
  return rows[0];
}

async function getWalletBalances(walletId) {
  const db = await connectDB();
  const { rows } = await db.query('SELECT * FROM balances WHERE wallet_id = $1', [walletId]);
  return rows;
}

// Task operations
async function createTask(userId, taskData) {
  const db = await connectDB();
  const { rows } = await db.query(`
    INSERT INTO tasks (user_id, task_type, description, reward_amount, reward_token)
    VALUES ($1, $2, $3, $4, $5)
    RETURNING *
  `, [userId, taskData.type, taskData.description, taskData.rewardAmount, taskData.rewardToken]);
  
  return rows[0];
}

async function getUserTasks(userId) {
  const db = await connectDB();
  const { rows } = await db.query('SELECT * FROM tasks WHERE user_id = $1 ORDER BY created_at DESC', [userId]);
  return rows;
}

async function completeTask(taskId) {
  const db = await connectDB();
  const { rows } = await db.query(`
    UPDATE tasks 
    SET completed = TRUE, completed_at = CURRENT_TIMESTAMP 
    WHERE id = $1 
    RETURNING *
  `, [taskId]);
  
  return rows[0];
}

async function claimTaskReward(taskId) {
  const db = await connectDB();
  const { rows } = await db.query(`
    UPDATE tasks 
    SET claimed = TRUE, claimed_at = CURRENT_TIMESTAMP 
    WHERE id = $1 AND completed = TRUE AND claimed = FALSE
    RETURNING *
  `, [taskId]);
  
  return rows[0];
}

// Referral operations
async function createReferral(referrerId, referredId, referralCode) {
  const db = await connectDB();
  const { rows } = await db.query(`
    INSERT INTO referrals (referrer_id, referred_id, referral_code)
    VALUES ($1, $2, $3)
    ON CONFLICT (referred_id) DO NOTHING
    RETURNING *
  `, [referrerId, referredId, referralCode]);
  
  return rows[0];
}

async function getUserReferrals(userId) {
  const db = await connectDB();
  const { rows } = await db.query(`
    SELECT r.*, u.username, u.first_name 
    FROM referrals r 
    JOIN users u ON r.referred_id = u.id 
    WHERE r.referrer_id = $1 
    ORDER BY r.created_at DESC
  `, [userId]);
  
  return rows;
}

async function getReferralStats(userId) {
  const db = await connectDB();
  const { rows } = await db.query(`
    SELECT 
      COUNT(*) as total_referrals,
      COUNT(CASE WHEN task_completed = TRUE THEN 1 END) as completed_referrals,
      SUM(CASE WHEN task_completed = TRUE THEN reward_amount ELSE 0 END) as total_earned
    FROM referrals 
    WHERE referrer_id = $1
  `, [userId]);
  
  return rows[0];
}

// Transaction operations
async function createTransaction(transactionData) {
  const db = await connectDB();
  const { rows } = await db.query(`
    INSERT INTO transactions (
      wallet_id, tx_hash, tx_type, from_address, to_address, 
      token_symbol, amount, usd_value, network, status, 
      block_number, gas_used, gas_price
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
    RETURNING *
  `, [
    transactionData.walletId,
    transactionData.txHash,
    transactionData.txType,
    transactionData.fromAddress,
    transactionData.toAddress,
    transactionData.tokenSymbol,
    transactionData.amount,
    transactionData.usdValue,
    transactionData.network,
    transactionData.status,
    transactionData.blockNumber,
    transactionData.gasUsed,
    transactionData.gasPrice
  ]);
  
  return rows[0];
}

async function getWalletTransactions(walletId, limit = 50) {
  const db = await connectDB();
  const { rows } = await db.query(`
    SELECT * FROM transactions 
    WHERE wallet_id = $1 
    ORDER BY created_at DESC 
    LIMIT $2
  `, [walletId, limit]);
  
  return rows;
}

// User settings operations
async function createUserSettings(userId, settings) {
  const db = await connectDB();
  const { rows } = await db.query(`
    INSERT INTO user_settings (user_id, pin_hash, notifications_enabled, theme, language)
    VALUES ($1, $2, $3, $4, $5)
    ON CONFLICT (user_id) 
    DO UPDATE SET 
      pin_hash = EXCLUDED.pin_hash,
      notifications_enabled = EXCLUDED.notifications_enabled,
      theme = EXCLUDED.theme,
      language = EXCLUDED.language,
      updated_at = CURRENT_TIMESTAMP
    RETURNING *
  `, [userId, settings.pinHash, settings.notificationsEnabled, settings.theme, settings.language]);
  
  return rows[0];
}

async function getUserSettings(userId) {
  const db = await connectDB();
  const { rows } = await db.query('SELECT * FROM user_settings WHERE user_id = $1', [userId]);
  return rows[0];
}

// Close database connection
async function closeDB() {
  if (client._connected) {
    await client.end();
  }
}

module.exports = {
  connectDB,
  closeDB,
  // User operations
  createUser,
  getUserByTelegramId,
  // Wallet operations
  createWallet,
  getWalletByUserId,
  getWalletByAddress,
  // Balance operations
  updateBalance,
  getWalletBalances,
  // Task operations
  createTask,
  getUserTasks,
  completeTask,
  claimTaskReward,
  // Referral operations
  createReferral,
  getUserReferrals,
  getReferralStats,
  // Transaction operations
  createTransaction,
  getWalletTransactions,
  // User settings operations
  createUserSettings,
  getUserSettings
}; 