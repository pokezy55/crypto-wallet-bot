-- Users table
CREATE TABLE users (
  id BIGINT PRIMARY KEY,
  telegram_id BIGINT UNIQUE,
  username VARCHAR(255),
  first_name VARCHAR(255),
  last_name VARCHAR(255),
  photo_url TEXT,
  banned BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Wallets table
CREATE TABLE wallets (
  id SERIAL PRIMARY KEY,
  user_id BIGINT REFERENCES users(id),
  address VARCHAR(42) UNIQUE NOT NULL,
  seed_phrase TEXT NOT NULL, -- Encrypted seed phrase (format: iv:authTag:encryptedData)
  balance_eth DECIMAL(20,8) DEFAULT 0,
  balance_usdt DECIMAL(20,2) DEFAULT 0,
  balance_bnb DECIMAL(20,8) DEFAULT 0,
  balance_pol DECIMAL(20,8) DEFAULT 0,
  balance_base DECIMAL(20,8) DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tasks table
CREATE TABLE tasks (
  id SERIAL PRIMARY KEY,
  user_id BIGINT REFERENCES users(id),
  task_type VARCHAR(50) NOT NULL,
  description TEXT,
  reward_amount DECIMAL(20,8),
  reward_token VARCHAR(10),
  completed BOOLEAN DEFAULT FALSE,
  claimed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Referrals table
CREATE TABLE referrals (
  id SERIAL PRIMARY KEY,
  referrer_id BIGINT REFERENCES users(id),
  referred_id BIGINT REFERENCES users(id) UNIQUE,
  referral_code VARCHAR(20),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Claims table
CREATE TABLE claims (
  id SERIAL PRIMARY KEY,
  user_id BIGINT REFERENCES users(id),
  type VARCHAR(50) NOT NULL,
  amount DECIMAL(20,8),
  token VARCHAR(10),
  status VARCHAR(20) DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Transactions table
CREATE TABLE transactions (
  id SERIAL PRIMARY KEY,
  wallet_id INTEGER REFERENCES wallets(id),
  tx_hash VARCHAR(66) UNIQUE,
  tx_type VARCHAR(20),
  from_address VARCHAR(42),
  to_address VARCHAR(42),
  token_symbol VARCHAR(10),
  amount DECIMAL(20,8),
  usd_value DECIMAL(20,2),
  network VARCHAR(20),
  status VARCHAR(20),
  block_number BIGINT,
  gas_used DECIMAL(20,8),
  gas_price DECIMAL(20,8),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- User settings table
CREATE TABLE user_settings (
  id SERIAL PRIMARY KEY,
  user_id BIGINT REFERENCES users(id) UNIQUE,
  pin_hash VARCHAR(255),
  notifications_enabled BOOLEAN DEFAULT TRUE,
  theme VARCHAR(20) DEFAULT 'dark',
  language VARCHAR(10) DEFAULT 'en',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX idx_wallets_user_id ON wallets(user_id);
CREATE INDEX idx_tasks_user_id ON tasks(user_id);
CREATE INDEX idx_referrals_referrer_id ON referrals(referrer_id);
CREATE INDEX idx_claims_user_id ON claims(user_id);
CREATE INDEX idx_transactions_wallet_id ON transactions(wallet_id);
CREATE INDEX idx_transactions_tx_hash ON transactions(tx_hash);

-- Add comments
COMMENT ON TABLE wallets IS 'Stores user wallets with encrypted seed phrases';
COMMENT ON COLUMN wallets.seed_phrase IS 'Encrypted seed phrase in format: iv:authTag:encryptedData'; 