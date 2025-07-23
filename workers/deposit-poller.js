// scripts/deposit-poller.js
const { getAllUserWallets, updateDepositProgress, getLastDepositProgress } = require('../lib/database');
const { getEvmDepositsUSD } = require('../lib/crypto-alchemy');
const { getUsdPrice } = require('../lib/crypto-prices');

const NETWORKS = [
  { name: 'ethereum', chainId: 1 },
  { name: 'bsc', chainId: 56 },
  { name: 'polygon', chainId: 137 },
  { name: 'base', chainId: 8453 },
];

async function pollDeposits() {
  console.log(`[DepositPoller] Start polling at ${new Date().toISOString()}`);
  const wallets = await getAllUserWallets();
  for (const wallet of wallets) {
    let totalDepositUSD = 0;
    for (const net of NETWORKS) {
      // Cek deposit native & ERC20 di jaringan ini
      const depositUSD = await getEvmDepositsUSD(wallet.address, net.name);
      totalDepositUSD += depositUSD;
    }
    // Ambil progress sebelumnya
    const lastProgress = await getLastDepositProgress(wallet.user_id);
    // Update progress jika berubah
    if (!lastProgress || Math.abs(lastProgress.totalDepositUSD - totalDepositUSD) > 0.01) {
      const status = totalDepositUSD >= 20 ? 'completed' : 'in_progress';
      await updateDepositProgress(wallet.user_id, totalDepositUSD, status);
      console.log(`[DepositPoller] Updated user ${wallet.user_id}: $${totalDepositUSD.toFixed(2)} (${status})`);
    }
  }
  console.log(`[DepositPoller] Polling done.`);
}

setInterval(pollDeposits, 60000);
pollDeposits(); 