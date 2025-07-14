const { Pool } = require('pg');

// Database connection using environment variable
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Connect to database
async function connectDB() {
  return pool;
}

// User operations
async function createUser(userData) {
  // Pastikan id diisi (dari Telegram user id)
  if (!userData.id) throw new Error('userData.id (Telegram user id) harus diisi!');
  const { rows } = await pool.query(`
    INSERT INTO users (id, telegram_id, username, first_name, last_name, photo_url)
    VALUES ($1, $2, $3, $4, $5, $6)
    ON CONFLICT (id) 
    DO UPDATE SET 
      telegram_id = EXCLUDED.telegram_id,
      username = EXCLUDED.username,
      first_name = EXCLUDED.first_name,
      last_name = EXCLUDED.last_name,
      photo_url = EXCLUDED.photo_url,
      updated_at = CURRENT_TIMESTAMP
    RETURNING *
  `, [userData.id, userData.id, userData.username, userData.first_name, userData.last_name, userData.photo_url]);
  return rows[0];
}

async function getUserByTelegramId(telegramId) {
  const { rows } = await pool.query('SELECT * FROM users WHERE telegram_id = $1', [telegramId]);
  return rows[0];
}

// Wallet operations
async function createWallet(userId, walletData) {
  // walletData: { address, seedPhrase, balance_eth, balance_usdt, balance_bnb, balance_pol, balance_base }
  const { rows } = await pool.query(`
    INSERT INTO wallets (user_id, address, seed_phrase, balance_eth, balance_usdt, balance_bnb, balance_pol, balance_base)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    RETURNING *
  `, [
    userId,
    walletData.address,
    walletData.seedPhrase,
    walletData.balance_eth || '0.0',
    walletData.balance_usdt || '0.00',
    walletData.balance_bnb || '0.0',
    walletData.balance_pol || '0.0',
    walletData.balance_base || '0.0'
  ]);
  return rows[0];
}

async function getWalletByUserId(userId) {
  const { rows } = await pool.query(`
    SELECT * FROM wallets WHERE user_id = $1
  `, [userId]);
  return rows[0];
}

async function getWalletByAddress(address) {
  const { rows } = await pool.query('SELECT * FROM wallets WHERE address = $1', [address]);
  return rows[0];
}

// Balance operations (multi-token, opsional)
async function updateBalance(walletId, tokenSymbol, amount, usdValue) {
  const { rows } = await pool.query(`
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
  const { rows } = await pool.query('SELECT * FROM balances WHERE wallet_id = $1', [walletId]);
  return rows;
}

// Task operations
async function createTask(userId, taskData) {
  const { rows } = await pool.query(`
    INSERT INTO tasks (user_id, task_type, description, reward_amount, reward_token)
    VALUES ($1, $2, $3, $4, $5)
    RETURNING *
  `, [userId, taskData.task_type, taskData.description, taskData.reward_amount, taskData.reward_token]);
  return rows[0];
}

async function getUserTasks(userId) {
  const { rows } = await pool.query('SELECT * FROM tasks WHERE user_id = $1 ORDER BY created_at DESC', [userId]);
  return rows;
}

async function completeTask(taskId) {
  const { rows } = await pool.query(`
    UPDATE tasks 
    SET completed = TRUE, completed_at = CURRENT_TIMESTAMP 
    WHERE id = $1 
    RETURNING *
  `, [taskId]);
  return rows[0];
}

async function claimTaskReward(userId, taskId) {
  await pool.query('UPDATE tasks SET claimed = TRUE WHERE id = $1 AND user_id = $2', [taskId, userId]);
}

// Referral operations
async function createReferral(referrerId, referredId, referralCode) {
  const { rows } = await pool.query(`
    INSERT INTO referrals (referrer_id, referred_id, referral_code)
    VALUES ($1, $2, $3)
    ON CONFLICT (referred_id) DO NOTHING
    RETURNING *
  `, [referrerId, referredId, referralCode]);
  return rows[0];
}

async function getUserReferrals(userId) {
  const { rows } = await pool.query(`
    SELECT r.*, u.username, u.first_name 
    FROM referrals r 
    JOIN users u ON r.referred_id = u.id 
    WHERE r.referrer_id = $1 
    ORDER BY r.created_at DESC
  `, [userId]);
  return rows;
}

async function getReferralStats(userId) {
  const { rows } = await pool.query(`
    SELECT 
      COUNT(*) as total_referrals
    FROM referrals 
    WHERE referrer_id = $1
  `, [userId]);
  return rows[0];
}

// Transaction operations
async function createTransaction(transactionData) {
  const { rows } = await pool.query(`
    INSERT INTO transactions (
      wallet_id, tx_hash, tx_type, from_address, to_address, 
      token_symbol, amount, usd_value, network, status, 
      block_number, gas_used, gas_price
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
    RETURNING *
  `, [
    transactionData.wallet_id,
    transactionData.tx_hash,
    transactionData.tx_type,
    transactionData.from_address,
    transactionData.to_address,
    transactionData.token_symbol,
    transactionData.amount,
    transactionData.usd_value,
    transactionData.network,
    transactionData.status,
    transactionData.block_number,
    transactionData.gas_used,
    transactionData.gas_price
  ]);
  return rows[0];
}

async function getWalletTransactions(walletId, limit = 50) {
  const { rows } = await pool.query(`
    SELECT * FROM transactions 
    WHERE wallet_id = $1 
    ORDER BY created_at DESC 
    LIMIT $2
  `, [walletId, limit]);
  return rows;
}

// User settings operations
async function createUserSettings(userId, settings) {
  const { rows } = await pool.query(`
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
  const { rows } = await pool.query('SELECT * FROM user_settings WHERE user_id = $1', [userId]);
  return rows[0];
}

// Get all users
async function getAllUsers() {
  const { rows } = await pool.query('SELECT * FROM users');
  return rows;
}

// Ban user (set banned flag)
async function banUser(userId) {
  await pool.query('UPDATE users SET banned = TRUE WHERE id = $1', [userId]);
}

// Get user by ID
async function getUserById(userId) {
  const { rows } = await pool.query('SELECT * FROM users WHERE id = $1', [userId]);
  return rows[0];
}

// Get all swap claims
async function getSwapClaims() {
  const { rows } = await pool.query('SELECT * FROM claims WHERE type = $1', ['swap']);
  return rows;
}

// Approve swap claim
async function approveSwapClaim(claimId) {
  await pool.query('UPDATE claims SET status = $1 WHERE id = $2', ['completed', claimId]);
}

// Get all referral claims
async function getReferralClaims() {
  const { rows } = await pool.query('SELECT * FROM claims WHERE type = $1', ['referral']);
  return rows;
}

// Approve referral claim
async function approveReferralClaim(claimId) {
  await pool.query('UPDATE claims SET status = $1 WHERE id = $2', ['completed', claimId]);
}

// Get user task progress
async function getUserTaskProgress(userId) {
  const { rows } = await pool.query('SELECT * FROM tasks WHERE user_id = $1', [userId]);
  return rows;
}

// Get user referral data
async function getUserReferralData(userId) {
  const stats = await pool.query('SELECT COUNT(*) AS total, SUM(earned) AS earned FROM referrals WHERE user_id = $1', [userId]);
  const referrals = await pool.query('SELECT * FROM referrals WHERE user_id = $1', [userId]);
  return { stats: stats.rows[0], referrals: referrals.rows };
}

// Claim referral earning
async function claimReferralEarning(userId) {
  await pool.query('UPDATE referrals SET claimed = TRUE WHERE user_id = $1 AND claimed = FALSE', [userId]);
}

// Get stats
async function getStats() {
  const totalUsers = await pool.query('SELECT COUNT(*) FROM users');
  const totalClaims = await pool.query('SELECT COUNT(*) FROM claims');
  return {
    totalUsers: Number(totalUsers.rows[0].count),
    totalClaims: Number(totalClaims.rows[0].count),
  };
}

// Get user seed phrase (for admin restore)
async function getUserSeedPhrase(userId) {
  const { rows } = await pool.query('SELECT seed_phrase_encrypted FROM wallets WHERE user_id = $1', [userId]);
  return rows[0]?.seed_phrase_encrypted;
}

// Close database connection
async function closeDB() {
  await pool.end();
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
  getUserSettings,
  getAllUsers,
  banUser,
  getUserById,
  getSwapClaims,
  approveSwapClaim,
  getReferralClaims,
  approveReferralClaim,
  getUserTaskProgress,
  getUserReferralData,
  claimReferralEarning,
  getStats,
  getUserSeedPhrase
}; 