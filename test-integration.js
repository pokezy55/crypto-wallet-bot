const db = require('./lib/database');

async function testIntegration() {
  console.log('🧪 Testing Complete Integration...\n');

  try {
    // Test 1: Create user via API simulation
    console.log('1️⃣ Testing User Creation...');
    const userData = {
      id: 987654321,
      username: 'integration_test',
      first_name: 'Integration',
      last_name: 'Test',
      photo_url: 'https://t.me/integration_test'
    };
    const user = await db.createUser(userData);
    console.log('✅ User created:', user.first_name);

    // Test 2: Create wallet via API simulation
    console.log('\n2️⃣ Testing Wallet Creation...');
    const walletData = {
      address: '0x' + Math.random().toString(16).substr(2, 40),
      seedPhraseEncrypted: 'encrypted_seed_phrase_test',
      privateKeyEncrypted: 'encrypted_private_key_test'
    };
    const wallet = await db.createWallet(user.id, walletData);
    console.log('✅ Wallet created:', wallet.address);

    // Test 3: Update balances
    console.log('\n3️⃣ Testing Balance Updates...');
    await db.updateBalance(wallet.id, 'ETH', '2.5', 5000.00);
    await db.updateBalance(wallet.id, 'USDT', '1000.00', 1000.00);
    const balances = await db.getWalletBalances(wallet.id);
    console.log('✅ Balances updated:', balances.map(b => `${b.token_symbol}: ${b.amount}`));

    // Test 4: Create and complete task
    console.log('\n4️⃣ Testing Task System...');
    const task = await db.createTask(user.id, {
      type: 'swap_task',
      description: 'Complete swap worth $10 to earn $5 USDT reward',
      rewardAmount: 5.00,
      rewardToken: 'USDT'
    });
    console.log('✅ Task created:', task.description);
    
    await db.completeTask(task.id);
    console.log('✅ Task completed');

    // Test 5: Test referral system
    console.log('\n5️⃣ Testing Referral System...');
    const referralUser = await db.createUser({
      id: 111222333,
      username: 'referred_user',
      first_name: 'Referred',
      last_name: 'User'
    });
    
    await db.createReferral(user.id, referralUser.id, 'REF123');
    console.log('✅ Referral created');
    
    const referralStats = await db.getReferralStats(user.id);
    console.log('✅ Referral stats:', referralStats);

    // Test 6: Test transaction creation
    console.log('\n6️⃣ Testing Transaction System...');
    const transaction = await db.createTransaction({
      walletId: wallet.id,
      txHash: '0x' + Math.random().toString(16).substr(2, 64),
      txType: 'send',
      fromAddress: wallet.address,
      toAddress: '0x' + Math.random().toString(16).substr(2, 40),
      tokenSymbol: 'ETH',
      amount: '0.1',
      usdValue: 200.00,
      network: 'ethereum',
      status: 'confirmed'
    });
    console.log('✅ Transaction created:', transaction.tx_hash);

    // Test 7: Test user settings
    console.log('\n7️⃣ Testing User Settings...');
    const settings = await db.createUserSettings(user.id, {
      pinHash: 'hashed_pin_123',
      notificationsEnabled: true,
      theme: 'dark',
      language: 'en'
    });
    console.log('✅ User settings created');

    // Test 8: Simulate API endpoints
    console.log('\n8️⃣ Testing API Endpoints...');
    
    // Simulate GET /api/wallet/[userId]
    const retrievedWallet = await db.getWalletByUserId(user.id);
    console.log('✅ GET /api/wallet/[userId] - Wallet retrieved:', retrievedWallet.address);
    
    // Simulate GET /api/task/[userId]
    const userTasks = await db.getUserTasks(user.id);
    console.log('✅ GET /api/task/[userId] - Tasks retrieved:', userTasks.length);
    
    // Simulate GET /api/referral/[userId]
    const [stats, referrals] = await Promise.all([
      db.getReferralStats(user.id),
      db.getUserReferrals(user.id)
    ]);
    console.log('✅ GET /api/referral/[userId] - Referral data retrieved');

    console.log('\n🎉 All Integration Tests Passed!');
    console.log('\n📊 Summary:');
    console.log(`  - User: ${user.first_name} (ID: ${user.id})`);
    console.log(`  - Wallet: ${wallet.address}`);
    console.log(`  - Balances: ${balances.length} tokens`);
    console.log(`  - Tasks: ${userTasks.length} tasks`);
    console.log(`  - Referrals: ${referrals.length} referrals`);
    console.log(`  - Transactions: 1 transaction`);

  } catch (error) {
    console.error('❌ Integration test failed:', error.message);
  } finally {
    await db.closeDB();
  }
}

testIntegration(); 