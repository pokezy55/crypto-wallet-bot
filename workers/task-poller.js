// scripts/task-poller.js
const { getAllUserWallets, updateDepositProgress, getLastDepositProgress, updateSwapProgress, getLastSwapProgress, addUserXP, updateUserLevel } = require('../lib/database');
const { getEvmDepositsUSD, getEvmSwapsUSD, getTotalBalanceUSD } = require('../lib/crypto-alchemy');

const NETWORKS = [
  { name: 'ethereum', chainId: 1 },
  { name: 'bsc', chainId: 56 },
  { name: 'polygon', chainId: 137 },
  { name: 'base', chainId: 8453 },
];

async function pollTasks() {
  console.log(`[TaskPoller] Start polling at ${new Date().toISOString()}`);
  const wallets = await getAllUserWallets();
  for (const wallet of wallets) {
    // --- Deposit (pakai total balance USD) ---
    let totalBalanceUSD = 0;
    for (const net of NETWORKS) {
      const balUSD = await getTotalBalanceUSD(wallet.address, net.name);
      totalBalanceUSD += balUSD;
    }
    const lastDeposit = await getLastDepositProgress(wallet.user_id);
    let depositStatus = totalBalanceUSD >= 20 ? 'completed' : 'in_progress';
    if (!lastDeposit || Math.abs(lastDeposit.totalDepositUSD - totalBalanceUSD) > 0.01) {
      await updateDepositProgress(wallet.user_id, totalBalanceUSD, depositStatus);
      if (totalBalanceUSD > (lastDeposit?.totalDepositUSD || 0)) {
        await addUserXP(wallet.user_id, 10);
      }
    }
    // --- Swap ---
    let totalSwapUSD = 0;
    for (const net of NETWORKS) {
      const swapUSD = await getEvmSwapsUSD(wallet.address, net.name);
      totalSwapUSD += swapUSD;
    }
    const lastSwap = await getLastSwapProgress(wallet.user_id);
    let swapStatus = totalSwapUSD >= 20 ? 'completed' : 'in_progress';
    if (!lastSwap || Math.abs(lastSwap.totalSwapUSD - totalSwapUSD) > 0.01) {
      await updateSwapProgress(wallet.user_id, totalSwapUSD, swapStatus);
      if (totalSwapUSD > (lastSwap?.totalSwapUSD || 0)) {
        await addUserXP(wallet.user_id, 10);
      }
    }
    // --- Level update ---
    // Ambil XP user, hitung level baru, update jika perlu
    // (Implementasi updateUserLevel di database.js)
    // await updateUserLevel(wallet.user_id);
  }
  console.log(`[TaskPoller] Polling done.`);
}

setInterval(pollTasks, 60000);
pollTasks(); 