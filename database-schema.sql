-- Create wallets table for storing user wallets with seed phrases
CREATE TABLE IF NOT EXISTS wallets (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    address VARCHAR(42) NOT NULL UNIQUE, -- Ethereum address (0x + 40 hex chars)
    seed_phrase TEXT NOT NULL, -- 12-word mnemonic phrase (not encrypted for backup purposes)
    balance_eth DECIMAL(20, 8) DEFAULT '0.0',
    balance_usdt DECIMAL(20, 8) DEFAULT '0.00',
    balance_bnb DECIMAL(20, 8) DEFAULT '0.0',
    balance_pol DECIMAL(20, 8) DEFAULT '0.0',
    balance_base DECIMAL(20, 8) DEFAULT '0.0',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_wallets_user_id ON wallets(user_id);
CREATE INDEX IF NOT EXISTS idx_wallets_address ON wallets(address);

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_wallets_updated_at 
    BEFORE UPDATE ON wallets 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Add comment to table
COMMENT ON TABLE wallets IS 'Stores user wallets with seed phrases for backup/restore functionality';
COMMENT ON COLUMN wallets.seed_phrase IS '12-word mnemonic phrase stored in plain text for backup purposes when user account gets banned'; 