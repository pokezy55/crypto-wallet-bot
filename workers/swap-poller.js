// scripts/swap-poller.js
const { getAllUserWallets, updateSwapProgress, getLastSwapProgress, addUserXP } = require('../lib/database');
const { getEvmSwapsUSD } = require('../lib/crypto-alchemy');

const NETWORKS = [
  { name: 'ethereum', chainId: 1 },
  { name: 'bsc', chainId: 56 },
  { name: 'polygon', chainId: 137 },
  { name: 'base', chainId: 8453 },
];

async function pollSwaps() {
  console.log(`[SwapPoller] Start polling at ${new Date().toISOString()}`);
  const wallets = await getAllUserWallets();
  for (const wallet of wallets) {
    let totalSwapUSD = 0;
    for (const net of NETWORKS) {
      // Cek swap Uniswap di jaringan ini
      const swapUSD = await getEvmSwapsUSD(wallet.address, net.name);
      totalSwapUSD += swapUSD;
    }
    // Ambil progress sebelumnya
    const lastProgress = await getLastSwapProgress(wallet.user_id);
    // Update progress jika berubah
    if (!lastProgress || Math.abs(lastProgress.totalSwapUSD - totalSwapUSD) > 0.01) {
      const status = totalSwapUSD >= 20 ? 'completed' : 'in_progress';
      await updateSwapProgress(wallet.user_id, totalSwapUSD, status);
      if (totalSwapUSD > (lastProgress?.totalSwapUSD || 0)) {
        // Tambah XP setiap swap sukses
        await addUserXP(wallet.user_id, 10);
      }
      console.log(`[SwapPoller] Updated user ${wallet.user_id}: $${totalSwapUSD.toFixed(2)} (${status})`);
    }
  }
  console.log(`[SwapPoller] Polling done.`);
}

setInterval(pollSwaps, 60000);
pollSwaps(); 