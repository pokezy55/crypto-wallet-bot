const { Pool } = require('pg');
const crypto = require('crypto');

// Neon database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

// Encryption key from environment variable
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY;
if (!ENCRYPTION_KEY) {
  throw new Error('ENCRYPTION_KEY environment variable is required');
}

// Encryption functions
function encrypt(text) {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-gcm', Buffer.from(ENCRYPTION_KEY, 'hex'), iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag();
  return iv.toString('hex') + ':' + authTag.toString('hex') + ':' + encrypted;
}

function decrypt(text) {
  try {
    const [ivHex, authTagHex, encryptedHex] = text.split(':');
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');
    const decipher = crypto.createDecipheriv('aes-256-gcm', Buffer.from(ENCRYPTION_KEY, 'hex'), iv);
    decipher.setAuthTag(authTag);
    let decrypted = decipher.update(encryptedHex, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch (error) {
    console.error('Decryption error:', error);
    throw new Error('Failed to decrypt data');
  }
}

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
  try {
    // Simpan seed phrase dalam bentuk plain text
    const { rows } = await pool.query(`
      INSERT INTO wallets (
        user_id, 
        address, 
        seed_phrase,
        balance_eth,
        balance_usdt,
        balance_bnb,
        balance_pol,
        balance_base
      )
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
  } catch (error) {
    console.error('Error creating wallet:', error);
    throw new Error('Failed to create wallet: ' + error.message);
  }
}

async function getWalletByUserId(userId) {
  try {
    const { rows } = await pool.query(`
      SELECT * FROM wallets WHERE user_id = $1
    `, [userId]);
    if (!rows[0]) return null;
    // Kembalikan seed phrase plain text
    return rows[0];
  } catch (error) {
    console.error('Error in getWalletByUserId:', error);
    throw error;
  }
}

async function getWalletByAddress(address) {
  const { rows } = await pool.query('SELECT * FROM wallets WHERE address = $1', [address]);
  if (rows[0]) {
    // Kembalikan seed phrase plain text
    return rows[0];
  }
  return null;
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
  try {
    // Update user's referred_by field
    await updateUserReferredBy(referredId, referrerId);
    
    try {
      // Create referral record
      const { rows } = await pool.query(`
        INSERT INTO referrals (referrer_id, referred_id, referral_code)
        VALUES ($1, $2, $3)
        ON CONFLICT (referred_id) DO NOTHING
        RETURNING *
      `, [referrerId, referredId, referralCode]);
      
      return rows[0];
    } catch (error) {
      // Jika error karena tabel referrals tidak ada, coba buat tabel terlebih dahulu
      if (error.code === '42P01') { // PostgreSQL error code untuk tabel tidak ada
        console.log('Table referrals not found, trying to create table');
        
        // Buat tabel referrals jika belum ada
        await pool.query(`
          CREATE TABLE IF NOT EXISTS referrals (
            id SERIAL PRIMARY KEY,
            referrer_id BIGINT REFERENCES users(id),
            referred_id BIGINT REFERENCES users(id) UNIQUE,
            referral_code VARCHAR(20),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          );
        `);
        
        // Coba lagi setelah membuat tabel
        const { rows } = await pool.query(`
          INSERT INTO referrals (referrer_id, referred_id, referral_code)
          VALUES ($1, $2, $3)
          ON CONFLICT (referred_id) DO NOTHING
          RETURNING *
        `, [referrerId, referredId, referralCode]);
        
        return rows[0];
      } else {
        throw error;
      }
    }
  } catch (error) {
    console.error('Error creating referral:', error);
    throw error;
  }
}

async function getUserReferrals(userId) {
  try {
    // Coba dengan query yang menggunakan details::jsonb
    try {
      const { rows } = await pool.query(`
        SELECT r.*, 
          u.username, 
          u.first_name, 
          u.last_name,
          u.telegram_id,
          u.custom_code,
          w.address,
          (SELECT COUNT(*) > 0 FROM transactions tx 
           JOIN wallets w ON tx.wallet_id = w.id 
           WHERE w.user_id = r.referred_id AND tx.tx_type = 'swap' AND tx.usd_value >= 10) as swap_completed,
          (SELECT COUNT(*) > 0 FROM transactions tx 
           JOIN wallets w ON tx.wallet_id = w.id 
           WHERE w.user_id = r.referred_id AND tx.tx_type = 'receive' AND tx.usd_value >= 20) as deposit_completed,
          (SELECT status FROM claims WHERE user_id = $1 AND type = 'referral' AND details::jsonb->>'referred_id' = r.referred_id::text LIMIT 1) as reward_status
        FROM referrals r 
        JOIN users u ON r.referred_id = u.id 
        LEFT JOIN wallets w ON r.referred_id = w.user_id
        WHERE r.referrer_id = $1 
        ORDER BY r.created_at DESC
      `, [userId]);
      
      // Return the actual user data without modifying it
      return rows;
    } catch (error) {
      // Jika error karena kolom details tidak ada, gunakan query alternatif
      if (error.code === '42703') { // PostgreSQL error code untuk kolom tidak ada
        console.log('Column details not found, using alternative query');
        const { rows } = await pool.query(`
          SELECT r.*, 
            u.username, 
            u.first_name, 
            u.last_name,
            u.telegram_id,
            u.custom_code,
            w.address,
            (SELECT COUNT(*) > 0 FROM transactions tx 
             JOIN wallets w ON tx.wallet_id = w.id 
             WHERE w.user_id = r.referred_id AND tx.tx_type = 'swap' AND tx.usd_value >= 10) as swap_completed,
            (SELECT COUNT(*) > 0 FROM transactions tx 
             JOIN wallets w ON tx.wallet_id = w.id 
             WHERE w.user_id = r.referred_id AND tx.tx_type = 'receive' AND tx.usd_value >= 20) as deposit_completed,
            'pending' as reward_status
          FROM referrals r 
          JOIN users u ON r.referred_id = u.id 
          LEFT JOIN wallets w ON r.referred_id = w.user_id
          WHERE r.referrer_id = $1 
          ORDER BY r.created_at DESC
        `, [userId]);
        
        // Return the actual user data without modifying it
        return rows;
      } else {
        throw error;
      }
    }
  } catch (error) {
    console.error('Error getting user referrals:', error);
    return [];
  }
}

async function getReferralStats(userId) {
  const { rows } = await pool.query(`
    SELECT 
      COUNT(*) as total_referrals,
      COUNT(CASE WHEN 
        (SELECT COUNT(*) > 0 FROM transactions tx 
         JOIN wallets w ON tx.wallet_id = w.id 
         WHERE w.user_id = r.referred_id AND tx.tx_type = 'swap' AND tx.usd_value >= 10) 
        AND 
        (SELECT COUNT(*) > 0 FROM transactions tx 
         JOIN wallets w ON tx.wallet_id = w.id 
         WHERE w.user_id = r.referred_id AND tx.tx_type = 'receive' AND tx.usd_value >= 20)
      THEN 1 END) as valid_referrals
    FROM referrals r
    WHERE referrer_id = $1
  `, [userId]);
  return rows[0];
}

// Check if referral is valid and create reward claim if needed
async function checkAndRewardReferral(userId) {
  try {
    // Get user's referrer
    const { rows: referralRows } = await pool.query(`
      SELECT * FROM referrals WHERE referred_id = $1
    `, [userId]);
    
    if (referralRows.length === 0) {
      return null; // User has no referrer
    }
    
    const referral = referralRows[0];
    const referrerId = referral.referrer_id;
    
    // Check if user completed both tasks
    const { rows: swapRows } = await pool.query(`
      SELECT COUNT(*) > 0 as completed FROM transactions tx 
      JOIN wallets w ON tx.wallet_id = w.id 
      WHERE w.user_id = $1 AND tx.tx_type = 'swap' AND tx.usd_value >= 10
    `, [userId]);
    
    const { rows: depositRows } = await pool.query(`
      SELECT COUNT(*) > 0 as completed FROM transactions tx 
      JOIN wallets w ON tx.wallet_id = w.id 
      WHERE w.user_id = $1 AND tx.tx_type = 'receive' AND tx.usd_value >= 20
    `, [userId]);
    
    const swapCompleted = swapRows[0]?.completed || false;
    const depositCompleted = depositRows[0]?.completed || false;
    
    if (swapCompleted && depositCompleted) {
      try {
        // Check if reward already claimed
        const { rows: claimRows } = await pool.query(`
          SELECT * FROM claims 
          WHERE user_id = $1 AND type = 'referral' AND details::jsonb->>'referred_id' = $2
        `, [referrerId, userId]);
        
        if (claimRows.length === 0) {
          // Create reward claim
          const details = JSON.stringify({ referred_id: userId });
          try {
            const { rows: newClaim } = await pool.query(`
              INSERT INTO claims (user_id, status, type, amount, token, details)
              VALUES ($1, $2, $3, $4, $5, $6)
              RETURNING *
            `, [referrerId, 'eligible', 'referral', 0.5, 'USDT', details]);
            
            return newClaim[0];
          } catch (error) {
            // Jika error karena kolom details tidak ada, coba tambahkan kolom terlebih dahulu
            if (error.code === '42703') { // PostgreSQL error code untuk kolom tidak ada
              console.log('Column details not found in claims table, trying to add column');
              
              // Tambahkan kolom details jika belum ada
              await pool.query(`
                ALTER TABLE claims ADD COLUMN IF NOT EXISTS details JSONB DEFAULT '{}';
              `);
              
              // Coba lagi setelah menambahkan kolom
              const { rows: newClaim } = await pool.query(`
                INSERT INTO claims (user_id, status, type, amount, token, details)
                VALUES ($1, $2, $3, $4, $5, $6)
                RETURNING *
              `, [referrerId, 'eligible', 'referral', 0.5, 'USDT', details]);
              
              return newClaim[0];
            } else {
              throw error;
            }
          }
        }
      } catch (error) {
        // Jika error karena kolom details tidak ada, gunakan query alternatif
        if (error.code === '42703') { // PostgreSQL error code untuk kolom tidak ada
          console.log('Column details not found, using alternative query for checking claims');
          
          // Periksa apakah sudah ada klaim untuk referral ini tanpa menggunakan details
          const { rows: claimRows } = await pool.query(`
            SELECT * FROM claims 
            WHERE user_id = $1 AND type = 'referral'
          `, [referrerId]);
          
          // Jika belum ada klaim sama sekali, buat klaim baru
          if (claimRows.length === 0) {
            try {
              const { rows: newClaim } = await pool.query(`
                INSERT INTO claims (user_id, status, type, amount, token)
                VALUES ($1, $2, $3, $4, $5)
                RETURNING *
              `, [referrerId, 'eligible', 'referral', 0.5, 'USDT']);
              
              return newClaim[0];
            } catch (error) {
              console.error('Error creating claim without details:', error);
              return null;
            }
          }
        } else {
          throw error;
        }
      }
    }
    
    return null;
  } catch (error) {
    console.error('Error checking referral reward:', error);
    return null;
  }
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
  await pool.query('UPDATE claims SET status = $1 WHERE id = $2', ['claimed', claimId]);
}

async function approveDepositClaim(claimId) {
  console.log('[approveDepositClaim] called with claimId:', claimId);
  const result = await pool.query('UPDATE claims SET status = $1 WHERE id = $2', ['claimed', claimId]);
  console.log('[approveDepositClaim] update result:', result.rowCount);
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
  const { rows } = await pool.query('SELECT seed_phrase FROM wallets WHERE user_id = $1', [userId]);
  if (!rows[0]?.seed_phrase) return null;
  
  try {
    return decrypt(rows[0].seed_phrase);
  } catch (error) {
    console.error('Failed to decrypt seed phrase:', error);
    return null;
  }
}

// Get user by referral code
async function getUserByReferralCode(referralCode) {
  try {
    // First try to find by direct referral_code in users table
    const { rows: userRows } = await pool.query(`
      SELECT * FROM users WHERE referral_code = $1
    `, [referralCode]);
    
    if (userRows.length > 0) {
      return userRows[0];
    }
    
    // If not found, check if it's a wallet-based referral code (REF + wallet prefix)
    if (referralCode.startsWith('REF')) {
      const walletPrefix = referralCode.substring(3); // Remove 'REF' prefix
      
      if (walletPrefix.length >= 4) {
        // Try to find user by wallet address prefix
        const { rows: walletRows } = await pool.query(`
          SELECT u.* FROM users u
          JOIN wallets w ON u.id = w.user_id
          WHERE w.address LIKE $1
        `, [`0x${walletPrefix}%`]);
        
        if (walletRows.length > 0) {
          return walletRows[0];
        }
      }
    }
    
    return null;
  } catch (error) {
    console.error('Error getting user by referral code:', error);
    return null;
  }
}

// Update user referral code
async function updateUserReferralCode(userId, referralCode) {
  try {
    const { rows } = await pool.query(`
      UPDATE users 
      SET referral_code = $1, updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
      RETURNING *
    `, [referralCode, userId]);
    return rows[0];
  } catch (error) {
    console.error('Error updating user referral code:', error);
    throw error;
  }
}

// Update user referred_by
async function updateUserReferredBy(userId, referrerId) {
  try {
    try {
      const { rows } = await pool.query(`
        UPDATE users 
        SET referred_by = $1, updated_at = CURRENT_TIMESTAMP
        WHERE id = $2
        RETURNING *
      `, [referrerId, userId]);
      return rows[0];
    } catch (error) {
      // Jika error karena kolom referred_by tidak ada, coba tambahkan kolom terlebih dahulu
      if (error.code === '42703') { // PostgreSQL error code untuk kolom tidak ada
        console.log('Column referred_by not found, trying to add column');
        
        // Tambahkan kolom referred_by jika belum ada
        await pool.query(`
          ALTER TABLE users ADD COLUMN IF NOT EXISTS referred_by BIGINT REFERENCES users(id);
        `);
        
        // Coba lagi setelah menambahkan kolom
        const { rows } = await pool.query(`
          UPDATE users 
          SET referred_by = $1, updated_at = CURRENT_TIMESTAMP
          WHERE id = $2
          RETURNING *
        `, [referrerId, userId]);
        
        return rows[0];
      } else {
        throw error;
      }
    }
  } catch (error) {
    console.error('Error updating user referred_by:', error);
    throw error;
  }
}

// Check if custom code is available
async function isCustomCodeAvailable(customCode) {
  try {
    try {
      const { rows } = await pool.query(`
        SELECT COUNT(*) as count
        FROM users
        WHERE custom_code = $1
      `, [customCode]);
      
      return parseInt(rows[0].count) === 0;
    } catch (error) {
      // Jika error karena kolom custom_code tidak ada, kolom belum dibuat, jadi kode tersedia
      if (error.code === '42703') { // PostgreSQL error code untuk kolom tidak ada
        console.log('Column custom_code not found, assuming code is available');
        return true;
      } else {
        throw error;
      }
    }
  } catch (error) {
    console.error('Error checking custom code availability:', error);
    throw error;
  }
}

// Set user custom referral code
async function setUserCustomCode(userId, customCode) {
  try {
    try {
      // Check if user already has a custom code
      const { rows: userRows } = await pool.query(`
        SELECT custom_code FROM users WHERE id = $1
      `, [userId]);
      
      if (userRows.length > 0 && userRows[0].custom_code) {
        throw new Error('User already has a custom referral code');
      }
      
      // Update user with new custom code
      const { rows } = await pool.query(`
        UPDATE users 
        SET custom_code = $1, updated_at = CURRENT_TIMESTAMP
        WHERE id = $2
        RETURNING *
      `, [customCode, userId]);
      
      return rows[0];
    } catch (error) {
      // Jika error karena kolom custom_code tidak ada, coba tambahkan kolom terlebih dahulu
      if (error.code === '42703') { // PostgreSQL error code untuk kolom tidak ada
        console.log('Column custom_code not found, trying to add column');
        
        // Tambahkan kolom custom_code jika belum ada
        await pool.query(`
          ALTER TABLE users ADD COLUMN IF NOT EXISTS custom_code VARCHAR(12) UNIQUE;
        `);
        
        // Coba lagi setelah menambahkan kolom
        const { rows } = await pool.query(`
          UPDATE users 
          SET custom_code = $1, updated_at = CURRENT_TIMESTAMP
          WHERE id = $2
          RETURNING *
        `, [customCode, userId]);
        
        return rows[0];
      } else {
        throw error;
      }
    }
  } catch (error) {
    console.error('Error setting custom referral code:', error);
    throw error;
  }
}

// Get user by custom code
async function getUserByCustomCode(customCode) {
  try {
    try {
      const { rows } = await pool.query(`
        SELECT * FROM users WHERE custom_code = $1
      `, [customCode]);
      
      return rows.length > 0 ? rows[0] : null;
    } catch (error) {
      // Jika error karena kolom custom_code tidak ada, kolom belum dibuat, jadi tidak ada user dengan kode tersebut
      if (error.code === '42703') { // PostgreSQL error code untuk kolom tidak ada
        console.log('Column custom_code not found, no user can have this code yet');
        return null;
      } else {
        throw error;
      }
    }
  } catch (error) {
    console.error('Error getting user by custom code:', error);
    throw error;
  }
}

async function getExistingDepositClaim(userId) {
  const { rows } = await pool.query(
    `SELECT * FROM claims WHERE user_id = $1 AND type = $2 AND status != $3`,
    [userId, 'deposit', 'rejected']
  );
  return rows;
}

async function createDepositClaim(userId, wallet, amount) {
  const { rows } = await pool.query(
    `INSERT INTO claims (user_id, status, type, amount, address, details) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
    [userId, 'processing', 'deposit', amount, wallet.address, null]
  );
  return rows[0];
}

async function getExistingSwapClaim(userId) {
  const { rows } = await pool.query(
    `SELECT * FROM claims WHERE user_id = $1 AND type = $2 AND status != $3`,
    [userId, 'swap', 'rejected']
  );
  return rows;
}

async function createSwapClaim(userId, wallet, amount) {
  const { rows } = await pool.query(
    `INSERT INTO claims (user_id, status, type, amount, address, details) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
    [userId, 'processing', 'swap', amount, wallet.address, null]
  );
  return rows[0];
}

async function getRewardQuota(type) {
  const { rows } = await pool.query('SELECT * FROM reward_quota WHERE type = $1', [type]);
  return rows[0];
}

async function decrementRewardQuota(type) {
  const { rows } = await pool.query(
    'UPDATE reward_quota SET remaining = remaining - 1, updated_at = CURRENT_TIMESTAMP WHERE type = $1 AND remaining > 0 RETURNING *',
    [type]
  );
  return rows[0];
}

async function getDepositClaims() {
  const { rows } = await pool.query('SELECT * FROM claims WHERE type = $1', ['deposit']);
  return rows;
}

// Ambil total swap USD langsung dari field total_swap di tabel wallets
async function getTotalSwapUSDByWalletId(walletId) {
  const { rows } = await pool.query(
    `SELECT COALESCE(total_swap, 0) AS total_swap FROM wallets WHERE id = $1`,
    [walletId]
  );
  return Number(rows[0]?.total_swap || 0);
}

// Close database connection
async function closeDB() {
  await pool.end();
}

// Export functions
module.exports = {
  pool,
  connectDB,
  closeDB,
  createUser,
  getUserByTelegramId,
  createWallet,
  getWalletByUserId,
  getWalletByAddress,
  updateBalance,
  getWalletBalances,
  createTask,
  getUserTasks,
  completeTask,
  claimTaskReward,
  createReferral,
  getUserReferrals,
  getReferralStats,
  checkAndRewardReferral,
  createTransaction,
  getWalletTransactions,
  createUserSettings,
  getUserSettings,
  getAllUsers,
  banUser,
  getUserById,
  getSwapClaims,
  approveSwapClaim,
  approveDepositClaim,
  getReferralClaims,
  approveReferralClaim,
  getUserTaskProgress,
  getUserReferralData,
  claimReferralEarning,
  getStats,
  getUserSeedPhrase,
  getUserByReferralCode,
  updateUserReferralCode,
  updateUserReferredBy,
  isCustomCodeAvailable,
  setUserCustomCode,
  getUserByCustomCode,
  getRewardQuota,
  decrementRewardQuota,
  getExistingDepositClaim,
  createDepositClaim,
  getExistingSwapClaim,
  createSwapClaim,
  getDepositClaims,
  getTotalSwapUSDByWalletId
}; 