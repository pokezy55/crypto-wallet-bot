const { Client } = require('pg');

// Test connection ke PostgreSQL server (tanpa database)
const client = new Client({
  host: 'localhost',
  port: 5432,
  user: 'postgres',
  password: 'new_password123' // GANTI DENGAN PASSWORD KAMU!
});

async function testConnection() {
  try {
    console.log('🔄 Testing PostgreSQL connection...');
    await client.connect();
    console.log('✅ Connected to PostgreSQL server!');
    
    // List semua database
    const result = await client.query('SELECT datname FROM pg_database WHERE datistemplate = false;');
    console.log('📋 Available databases:');
    result.rows.forEach(row => {
      console.log(`  - ${row.datname}`);
    });
    
    await client.end();
  } catch (error) {
    console.error('❌ Connection failed:', error.message);
    console.log('\n🔧 Possible solutions:');
    console.log('1. Check if PostgreSQL is running');
    console.log('2. Verify password is correct');
    console.log('3. Try: psql -U postgres -h localhost');
  }
}

testConnection(); 