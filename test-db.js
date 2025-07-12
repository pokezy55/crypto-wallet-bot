const { Client } = require('pg');

// Config manual - ganti password sesuai PostgreSQL kamu
const client = new Client({
  host: 'localhost',
  port: 5432,
  database: 'crypto_wallet_bot',
  user: 'postgres',
  password: 'Bandung123' // GANTI DENGAN PASSWORD YANG KAMU SET!
});

async function testConnection() {
  try {
    console.log('🔄 Connecting to PostgreSQL...');
    await client.connect();
    console.log('✅ Connected to PostgreSQL successfully!');
    
    const result = await client.query('SELECT NOW() as current_time, version() as version');
    console.log('📅 Current time:', result.rows[0].current_time);
    console.log('🔧 PostgreSQL version:', result.rows[0].version.split(' ')[0]);
    
    // Test create table
    console.log('🔄 Testing table creation...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS test_table (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Test table created successfully!');
    
    await client.end();
    console.log('👋 Connection closed.');
  } catch (error) {
    console.error('❌ Connection failed:', error.message);
    console.log('\n🔧 Troubleshooting tips:');
    console.log('1. Pastikan PostgreSQL sudah running');
    console.log('2. Cek password di .env.local atau ganti di code ini');
    console.log('3. Pastikan database "crypto_wallet_bot" sudah dibuat');
    console.log('4. Cek port 5432 tidak digunakan aplikasi lain');
  }
}

testConnection();