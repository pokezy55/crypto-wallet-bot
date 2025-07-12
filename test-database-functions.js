const db = require('./lib/database');

async function testDatabaseFunctions() {
  try {
    console.log('🧪 Testing database functions...\n');

    // Test 1: Create user
    console.log('1️⃣ Testing createUser...');
    const userData = {
      id: 123456789,
      username: 'testuser',
      first_name: 'Test',
      last_name: 'User',
      photo_url: 'https://t.me/testuser'
    };
    const user = await db.createUser(userData);
    console.log('✅ User created:', user.first_name);

    // Test 2: Get user
    console.log('\n2️⃣ Testing getUserByTelegramId...');
    const foundUser = await db.getUserByTelegramId(123456789);
    console.log('✅ User found:', foundUser.username);

    // Test 3: Create wallet
    console.log('\n3️⃣ Testing createWallet...');
    const walletData = {
      address: '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6',
      seedPhraseEncrypted: 'encrypted_seed_phrase_here',
      privateKeyEncrypted: 'encrypted_private_key_here'
    };
    const wallet = await db.createWallet(user.id, walletData);
    console.log('✅ Wallet created:', wallet.address);

    // Test 4: Get wallet
    console.log('\n4️⃣ Testing getWalletByUserId...');
    const foundWallet = await db.getWalletByUserId(user.id);
    console.log('✅ Wallet found:', foundWallet.address);

    // Test 5: Update balance
    console.log('\n5️⃣ Testing updateBalance...');
    await db.updateBalance(wallet.id, 'ETH', '1.5', 3000.00);
    await db.updateBalance(wallet.id, 'USDT', '500.00', 500.00);
    console.log('✅ Balances updated');

    // Test 6: Get balances
    console.log('\n6️⃣ Testing getWalletBalances...');
    const balances = await db.getWalletBalances(wallet.id);
    console.log('✅ Balances:', balances.map(b => `${b.token_symbol}: ${b.amount}`));

    // Test 7: Create task
    console.log('\n7️⃣ Testing createTask...');
    const task = await db.createTask(user.id, {
      type: 'swap_task',
      description: 'Complete swap worth $10 to earn $5 USDT reward',
      rewardAmount: 5.00,
      rewardToken: 'USDT'
    });
    console.log('✅ Task created:', task.description);

    // Test 8: Get user tasks
    console.log('\n8️⃣ Testing getUserTasks...');
    const tasks = await db.getUserTasks(user.id);
    console.log('✅ Tasks found:', tasks.length);

    // Test 9: Complete task
    console.log('\n9️⃣ Testing completeTask...');
    await db.completeTask(task.id);
    console.log('✅ Task completed');

    // Test 10: Get referral stats
    console.log('\n🔟 Testing getReferralStats...');
    const stats = await db.getReferralStats(user.id);
    console.log('✅ Referral stats:', stats);

    console.log('\n🎉 All database functions tested successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    await db.closeDB();
  }
}

testDatabaseFunctions(); 