const { Client } = require('pg');

const client = new Client({
  host: 'localhost',
  port: 5432,
  database: 'crypto_wallet_bot',
  user: 'postgres',
  password: 'Bandung123'
});

async function setupDatabase() {
  try {
    console.log('🔄 Connecting to database...');
    await client.connect();
    console.log('✅ Connected successfully!');

    console.log('\n📋 Creating database schema...');

    // 1. Users table
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        telegram_id BIGINT UNIQUE NOT NULL,
        username VARCHAR(255),
        first_name VARCHAR(255) NOT NULL,
        last_name VARCHAR(255),
        photo_url TEXT,
        banned BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ Users table created');

    // 2. Wallets table
    await client.query(`
      CREATE TABLE IF NOT EXISTS wallets (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        address VARCHAR(255) UNIQUE NOT NULL,
        seed_phrase_encrypted TEXT NOT NULL,
        private_key_encrypted TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ Wallets table created');

    // 3. Balances table
    await client.query(`
      CREATE TABLE IF NOT EXISTS balances (
        id SERIAL PRIMARY KEY,
        wallet_id INTEGER REFERENCES wallets(id) ON DELETE CASCADE,
        token_symbol VARCHAR(10) NOT NULL,
        amount DECIMAL(20, 8) DEFAULT 0,
        usd_value DECIMAL(20, 2) DEFAULT 0,
        last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(wallet_id, token_symbol)
      );
    `);
    console.log('✅ Balances table created');

    // 4. Tasks table
    await client.query(`
      CREATE TABLE IF NOT EXISTS tasks (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        task_type VARCHAR(50) NOT NULL,
        description TEXT NOT NULL,
        reward_amount DECIMAL(10, 2) NOT NULL,
        reward_token VARCHAR(10) DEFAULT 'USDT',
        completed BOOLEAN DEFAULT FALSE,
        claimed BOOLEAN DEFAULT FALSE,
        completed_at TIMESTAMP,
        claimed_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ Tasks table created');

    // 5. Referrals table
    await client.query(`
      CREATE TABLE IF NOT EXISTS referrals (
        id SERIAL PRIMARY KEY,
        referrer_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        referred_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        referral_code VARCHAR(50) NOT NULL,
        reward_amount DECIMAL(10, 2) DEFAULT 0.5,
        reward_token VARCHAR(10) DEFAULT 'USDT',
        task_completed BOOLEAN DEFAULT FALSE,
        reward_claimed BOOLEAN DEFAULT FALSE,
        claimed_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(referred_id)
      );
    `);
    console.log('✅ Referrals table created');

    // 6. Transactions table
    await client.query(`
      CREATE TABLE IF NOT EXISTS transactions (
        id SERIAL PRIMARY KEY,
        wallet_id INTEGER REFERENCES wallets(id) ON DELETE CASCADE,
        tx_hash VARCHAR(255) UNIQUE,
        tx_type VARCHAR(20) NOT NULL, -- 'send', 'receive', 'swap'
        from_address VARCHAR(255),
        to_address VARCHAR(255),
        token_symbol VARCHAR(10) NOT NULL,
        amount DECIMAL(20, 8) NOT NULL,
        usd_value DECIMAL(20, 2),
        network VARCHAR(20) DEFAULT 'ethereum',
        status VARCHAR(20) DEFAULT 'pending',
        block_number BIGINT,
        gas_used BIGINT,
        gas_price BIGINT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ Transactions table created');

    // 7. User settings table
    await client.query(`
      CREATE TABLE IF NOT EXISTS user_settings (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        pin_hash VARCHAR(255),
        notifications_enabled BOOLEAN DEFAULT TRUE,
        theme VARCHAR(20) DEFAULT 'dark',
        language VARCHAR(10) DEFAULT 'en',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id)
      );
    `);
    console.log('✅ User settings table created');

    // Insert default task
    await client.query(`
      INSERT INTO tasks (user_id, task_type, description, reward_amount, reward_token)
      SELECT 
        u.id,
        'swap_task',
        'Complete swap worth $10 to earn $5 USDT reward',
        5.00,
        'USDT'
      FROM users u
      WHERE NOT EXISTS (
        SELECT 1 FROM tasks t 
        WHERE t.user_id = u.id AND t.task_type = 'swap_task'
      );
    `);
    console.log('✅ Default tasks created');

    // Create indexes for better performance
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_users_telegram_id ON users(telegram_id);
      CREATE INDEX IF NOT EXISTS idx_wallets_user_id ON wallets(user_id);
      CREATE INDEX IF NOT EXISTS idx_wallets_address ON wallets(address);
      CREATE INDEX IF NOT EXISTS idx_balances_wallet_id ON balances(wallet_id);
      CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON tasks(user_id);
      CREATE INDEX IF NOT EXISTS idx_referrals_referrer_id ON referrals(referrer_id);
      CREATE INDEX IF NOT EXISTS idx_referrals_referred_id ON referrals(referred_id);
      CREATE INDEX IF NOT EXISTS idx_transactions_wallet_id ON transactions(wallet_id);
      CREATE INDEX IF NOT EXISTS idx_transactions_tx_hash ON transactions(tx_hash);
    `);
    console.log('✅ Database indexes created');

    // Show table summary
    const tables = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `);
    
    console.log('\n📊 Database schema created successfully!');
    console.log('📋 Tables created:');
    tables.rows.forEach(row => {
      console.log(`  - ${row.table_name}`);
    });

    await client.end();
    console.log('\n👋 Database setup completed!');

  } catch (error) {
    console.error('❌ Database setup failed:', error.message);
    await client.end();
  }
}

setupDatabase(); 