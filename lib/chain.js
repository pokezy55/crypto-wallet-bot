const { JsonRpcProvider } = require('ethers');

const CHAINS = {
  eth: {
    chainId: 1,
    name: 'Ethereum',
    rpcUrl: () => `https://eth-mainnet.g.alchemy.com/v2/${process.env.ALCHEMY_API_KEY || process.env.NEXT_PUBLIC_ALCHEMY_API_KEY}`,
    nativeSymbol: 'ETH',
    tokens: [
      { symbol: 'ETH', address: '', decimals: 18, isNative: true },
      { symbol: 'USDT', address: '0xdAC17F958D2ee523a2206206994597C13D831ec7', decimals: 6, isNative: false },
      { symbol: 'USDC', address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', decimals: 6, isNative: false },
    ],
  },
  base: {
    chainId: 8453,
    name: 'Base',
    rpcUrl: () => `https://base-mainnet.g.alchemy.com/v2/${process.env.ALCHEMY_API_KEY || process.env.NEXT_PUBLIC_ALCHEMY_API_KEY}`,
    nativeSymbol: 'ETH',
    tokens: [
      { symbol: 'ETH', address: '', decimals: 18, isNative: true },
      { symbol: 'USDT', address: '0xA7D9ddBE1f17865597fBD27EC712455208B6b76D', decimals: 6, isNative: false },
      { symbol: 'USDC', address: '0xd9AAEC86B65d86f6A7B5B1b0c42FFA531710b6CA', decimals: 6, isNative: false },
    ],
  },
  polygon: {
    chainId: 137,
    name: 'Polygon',
    rpcUrl: () => `https://polygon-mainnet.g.alchemy.com/v2/${process.env.ALCHEMY_API_KEY || process.env.NEXT_PUBLIC_ALCHEMY_API_KEY}`,
    nativeSymbol: 'MATIC',
    tokens: [
      { symbol: 'MATIC', address: '', decimals: 18, isNative: true },
      { symbol: 'USDT', address: '0x3813e82e6f7098b9583FC0F33a962D02018B6803', decimals: 6, isNative: false },
      { symbol: 'USDC', address: '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174', decimals: 6, isNative: false },
    ],
  },
  bsc: {
    chainId: 56,
    name: 'Binance Smart Chain',
    rpcUrl: () => 'https://bnb-mainnet.g.alchemy.com/public/', // Selalu public, tidak pernah pakai Alchemy
    nativeSymbol: 'BNB',
    tokens: [
      { symbol: 'BNB', address: '', decimals: 18, isNative: true },
      { symbol: 'USDT', address: '0x55d398326f99059fF775485246999027B3197955', decimals: 18, isNative: false },
      { symbol: 'USDC', address: '0x8ac76a51cc950d9822d68b83fe1ad97b32cd580d', decimals: 18, isNative: false },
    ],
  },
};

// Untuk frontend/client-side: hanya return daftar token default, tanpa akses env/API key
function getTokenListStatic(chainKey) {
  return CHAINS[chainKey]?.tokens || [];
}

// Untuk backend/server-side: akses provider dan env
function getChain(chainKey) {
  const chain = CHAINS[chainKey];
  if (!chain) throw new Error('Unknown chain');
  const rpcUrl = chain.rpcUrl();
  if (rpcUrl.includes('undefined') || rpcUrl.includes('null')) {
    throw new Error('Alchemy API key not set');
  }
  return { ...chain, rpcUrl };
}

function getProvider(chainKey) {
  const chain = getChain(chainKey);
  return new JsonRpcProvider(chain.rpcUrl);
}

function getTokenList(chainKey) {
  const chain = getChain(chainKey);
  return chain.tokens;
}

module.exports = {
  CHAINS,
  getChain,
  getProvider,
  getTokenList,
  getTokenListStatic, // untuk frontend
}; 