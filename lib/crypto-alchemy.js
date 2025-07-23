const ALCHEMY_API_KEY = process.env.ALCHEMY_API_KEY || 'ZmMF5QF7DT6jMGP3sps6a';

const ALCHEMY_BASE_URLS = {
  eth: `https://eth-mainnet.g.alchemy.com/v2/`,
  polygon: `https://polygon-mainnet.g.alchemy.com/v2/`,
  bsc: `https://bsc-mainnet.g.alchemy.com/v2/`,
  base: `https://base-mainnet.g.alchemy.com/v2/`,
}

function getAlchemyUrl(chain) {
  const key = (chain || 'eth').toLowerCase();
  return (ALCHEMY_BASE_URLS[key] || ALCHEMY_BASE_URLS.eth) + ALCHEMY_API_KEY;
}

// WARNING: Jangan gunakan file ini untuk BSC! Untuk BSC, gunakan ethers.js public RPC, bukan Alchemy.

export async function fetchEthBalance(address, chain = 'eth') {
  if (chain === 'bsc') {
    throw new Error('[Alchemy] fetchEthBalance: BSC tidak didukung oleh Alchemy. Gunakan ethers.js public RPC!');
  }
  const url = getAlchemyUrl(chain);
  console.log('[Alchemy] fetchEthBalance - URL:', url, 'Address:', address, 'Chain:', chain);
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'eth_getBalance',
        params: [address, 'latest']
      })
    })
    if (!res.ok) {
      const errText = await res.text();
      console.error('[Alchemy] fetchEthBalance error', chain, errText)
      return 0
    }
    const data = await res.json()
    if (data.error) {
      console.error('[Alchemy] fetchEthBalance error', chain, data.error)
      return 0
    }
    if (data.result) {
      return parseInt(data.result, 16) / 1e18
    }
    return 0
  } catch (err) {
    console.error('[Alchemy] fetchEthBalance FETCH FAILED', chain, err);
    return 0;
  }
}

const TOKEN_ADDRESSES = {
  eth: {
    USDT: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
    USDC: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
  },
  polygon: {
    USDT: '0xc2132D05D31c914a87C6611C10748AEb04B58e8F',
    USDC: '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174',
  },
  bsc: {
    USDT: '0x55d398326f99059fF775485246999027B3197955',
    USDC: '0x8ac76a51cc950d9822d68b83fe1ad97b32cd580d',
  },
  base: {
    USDT: '0xAcd9e1c7A58dc6e6F47d6B00e0c9B6cfc6b54cd6',
    USDC: '0x3355df6D4c9C3035724Fd0e3914dE96A5a83aaf4',
  }
}

export async function fetchErc20Balance(address, symbol, chain = 'eth') {
  if (chain === 'bsc') {
    throw new Error('[Alchemy] fetchErc20Balance: BSC tidak didukung oleh Alchemy. Gunakan ethers.js public RPC!');
  }
  const contract = TOKEN_ADDRESSES[chain]?.[symbol]
  if (!contract) return 0
  const url = getAlchemyUrl(chain);
  const data = '0x70a08231000000000000000000000000' + address.replace('0x', '')
  console.log('[Alchemy] fetchErc20Balance - URL:', url, 'Address:', address, 'Symbol:', symbol, 'Chain:', chain, 'Contract:', contract);
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'eth_call',
        params: [
          {
            to: contract,
            data
          },
          'latest'
        ]
      })
    })
    if (!res.ok) {
      const errText = await res.text();
      console.error('[Alchemy] fetchErc20Balance error', chain, errText)
      return 0
    }
    const result = await res.json()
    if (result.error) {
      console.error('[Alchemy] fetchErc20Balance error', chain, result.error)
      return 0
    }
    // Validasi hex string sebelum parsing
    if (result.result && /^0x[0-9a-fA-F]+$/.test(result.result)) {
      let decimals = 18;
      if (symbol === 'USDT' || symbol === 'USDC') decimals = 6;
      return parseInt(result.result, 16) / 10 ** decimals
    }
    // Jika tidak valid, return 0
    return 0
  } catch (err) {
    console.error('[Alchemy] fetchErc20Balance FETCH FAILED', chain, err);
    return 0;
  }
}

// Fungsi untuk fetch transaction history (Alchemy Transfers API v2)
export async function fetchTransactionHistory(address, chain = 'eth') {
  const url = getAlchemyUrl(chain);
  console.log('[Alchemy] fetchTransactionHistory - URL:', url, 'Address:', address, 'Chain:', chain);
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: 1,
        jsonrpc: '2.0',
        method: 'alchemy_getAssetTransfers',
        params: [{
          fromBlock: '0x0',
          toBlock: 'latest',
          toAddress: address,
          category: ['external', 'erc20', 'erc721', 'erc1155', 'internal', 'token'],
          withMetadata: true,
          excludeZeroValue: true,
          maxCount: '0x32'
        }]
      })
    });
    if (!res.ok) {
      const errText = await res.text();
      console.error('[Alchemy] fetchTransactionHistory error', chain, errText)
      return []
    }
    const data = await res.json();
    if (data.error) {
      console.error('[Alchemy] fetchTransactionHistory error', chain, data.error)
      return []
    }
    return data.result?.transfers || [];
  } catch (err) {
    console.error('[Alchemy] fetchTransactionHistory FETCH FAILED', chain, err);
    return [];
  }
}

const { getUsdPrice } = require('./crypto-prices');

async function getTotalBalanceUSD(address, chain = 'eth') {
  let totalUSD = 0;
  // 1. Native balance
  let nativeBalance = 0;
  try {
    nativeBalance = await exports.fetchEthBalance(address, chain);
    const nativeSymbol = chain === 'eth' ? 'ETH' : chain.toUpperCase();
    const nativePrice = await getUsdPrice(nativeSymbol, chain);
    totalUSD += nativeBalance * nativePrice;
  } catch (e) {}
  // 2. ERC20 tokens
  // (Untuk demo: USDT & USDC, bisa dikembangkan untuk semua token)
  const tokens = ['USDT', 'USDC'];
  for (const symbol of tokens) {
    try {
      const bal = await exports.fetchErc20Balance(address, symbol, chain);
      const price = await getUsdPrice(symbol, chain);
      totalUSD += bal * price;
    } catch (e) {}
  }
  return totalUSD;
}

module.exports.getTotalBalanceUSD = getTotalBalanceUSD;

// Uniswap router addresses (v2/v3, ETH, BSC, Polygon, Base)
const UNISWAP_ROUTERS = [
  // Ethereum
  '0xE592427A0AEce92De3Edee1F18E0157C05861564', // Uniswap V3
  '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D', // Uniswap V2
  // Polygon
  '0x1b02da8cb0d097eb8d57a175b88c7d8b47997506', // SushiSwap (Polygon)
  '0x68b3465833fb72A70ecDF485E0e4C7bD8665Fc45', // Uniswap V3 (Polygon)
  // BSC
  '0x1111111254EEB25477B68fb85Ed929f73A960582', // 1inch (BSC)
  // Base
  '0x327Df1E6de05895d2ab08513aaDD9313Fe505d86', // Uniswap V3 (Base)
];

async function getEvmSwapsUSD(address, chain = 'eth') {
  const txs = await exports.fetchTransactionHistory(address, chain);
  let totalUSD = 0;
  for (const tx of txs) {
    // Deteksi swap: to = router address, ada event log swap, atau asset = token
    if (tx.to && UNISWAP_ROUTERS.map(r => r.toLowerCase()).includes(tx.to.toLowerCase())) {
      let symbol = tx.asset || tx.tokenSymbol || '';
      let amount = parseFloat(tx.value || tx.amount || '0');
      if (!symbol || !amount) continue;
      let price = 0;
      try {
        price = await getUsdPrice(symbol, chain);
      } catch (e) {
        price = 0;
      }
      totalUSD += amount * price;
    }
    // Bisa juga cek event log jika ada (TODO: lebih detail)
  }
  return totalUSD;
}

module.exports.getEvmSwapsUSD = getEvmSwapsUSD; 