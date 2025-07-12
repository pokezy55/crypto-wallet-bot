const { Client } = require('pg');

const client = new Client({
  host: 'localhost',
  port: 5432,
  database: 'crypto_wallet_bot',
  user: 'postgres',
  password: 'Bandung123'
});

async function fixSchema() {
  try {
    await client.connect();
    console.log('✅ Connected to database');

    console.log('\n🔧 Fixing database schema...');

    // Fix users table - add missing columns
    await client.query(`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS last_name VARCHAR(255),
      ADD COLUMN IF NOT EXISTS photo_url TEXT,
      ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
    `);
    console.log('✅ Users table fixed');

    // Fix wallets table - add missing columns
    await client.query(`
      ALTER TABLE wallets 
      ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
    `);
    console.log('✅ Wallets table fixed');

    // Fix user_settings table - add missing columns
    await client.query(`
      ALTER TABLE user_settings 
      ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
    `);
    console.log('✅ User settings table fixed');

    // Add missing constraints
    await client.query(`
      ALTER TABLE users 
      ALTER COLUMN first_name SET NOT NULL;
    `);
    console.log('✅ Users constraints fixed');

    // Show updated structure
    console.log('\n📋 Updated Users table structure:');
    const usersStructure = await client.query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      ORDER BY ordinal_position;
    `);
    
    usersStructure.rows.forEach(row => {
      console.log(`  - ${row.column_name}: ${row.data_type} (${row.is_nullable === 'YES' ? 'nullable' : 'not null'})`);
    });

    console.log('\n🎉 Schema fixed successfully!');

  } catch (error) {
    console.error('❌ Error fixing schema:', error.message);
  } finally {
    await client.end();
  }
}

fixSchema(); 