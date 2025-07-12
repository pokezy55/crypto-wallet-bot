const { Client } = require('pg');

const client = new Client({
  host: 'localhost',
  port: 5432,
  database: 'crypto_wallet_bot',
  user: 'postgres',
  password: 'Bandung123'
});

async function checkSchema() {
  try {
    await client.connect();
    console.log('✅ Connected to database');

    // Check users table structure
    console.log('\n📋 Users table structure:');
    const usersStructure = await client.query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      ORDER BY ordinal_position;
    `);
    
    usersStructure.rows.forEach(row => {
      console.log(`  - ${row.column_name}: ${row.data_type} (${row.is_nullable === 'YES' ? 'nullable' : 'not null'})`);
    });

    // Check all tables
    console.log('\n📊 All tables:');
    const tables = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `);
    
    tables.rows.forEach(row => {
      console.log(`  - ${row.table_name}`);
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.end();
  }
}

checkSchema(); 