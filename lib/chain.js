const { JsonRpcProvider } = require('ethers');

const CHAINS = {
  eth: {
    chainId: 1,
    name: 'Ethereum',
    rpcUrl: () => `https://eth-mainnet.g.alchemy.com/v2/${process.env.ALCHEMY_API_KEY || process.env.NEXT_PUBLIC_ALCHEMY_API_KEY}`,
    nativeSymbol: 'ETH',
    tokens: [
      { symbol: 'ETH', name: 'Ethereum', address: '', decimals: 18, isNative: true, logo: 'https://raw.githubusercontent.com/spothq/cryptocurrency-icons/master/svg/color/eth.svg' },
      { symbol: 'USDT', name: 'Tether USD', address: '0xdAC17F958D2ee523a2206206994597C13D831ec7', decimals: 6, isNative: false, logo: 'https://raw.githubusercontent.com/spothq/cryptocurrency-icons/master/svg/color/usdt.svg' },
      { symbol: 'USDC', name: 'USD Coin', address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', decimals: 6, isNative: false, logo: 'https://raw.githubusercontent.com/spothq/cryptocurrency-icons/master/svg/color/usdc.svg' },
    ],
  },
  base: {
    chainId: 8453,
    name: 'Base',
    rpcUrl: () => `https://base-mainnet.g.alchemy.com/v2/${process.env.ALCHEMY_API_KEY || process.env.NEXT_PUBLIC_ALCHEMY_API_KEY}`,
    nativeSymbol: 'ETH',
    tokens: [
      { symbol: 'ETH', name: 'Base ETH', address: '', decimals: 18, isNative: true, logo: 'https://raw.githubusercontent.com/spothq/cryptocurrency-icons/master/svg/color/eth.svg' },
      { symbol: 'USDT', name: 'Tether USD', address: '0xA7D9ddBE1f17865597fBD27EC712455208B6b76D', decimals: 6, isNative: false, logo: 'https://raw.githubusercontent.com/spothq/cryptocurrency-icons/master/svg/color/usdt.svg' },
      { symbol: 'USDC', name: 'USD Coin', address: '0xd9AAEC86B65d86f6A7B5B1b0c42FFA531710b6CA', decimals: 6, isNative: false, logo: 'https://raw.githubusercontent.com/spothq/cryptocurrency-icons/master/svg/color/usdc.svg' },
    ],
  },
  polygon: {
    chainId: 137,
    name: 'Polygon',
    rpcUrl: () => `https://polygon-mainnet.g.alchemy.com/v2/${process.env.ALCHEMY_API_KEY || process.env.NEXT_PUBLIC_ALCHEMY_API_KEY}`,
    nativeSymbol: 'MATIC',
    tokens: [
      { symbol: 'MATIC', name: 'Polygon', address: '', decimals: 18, isNative: true, logo: 'https://raw.githubusercontent.com/spothq/cryptocurrency-icons/master/svg/color/matic.svg' },
      { symbol: 'USDT', name: 'Tether USD', address: '0x3813e82e6f7098b9583FC0F33a962D02018B6803', decimals: 6, isNative: false, logo: 'https://raw.githubusercontent.com/spothq/cryptocurrency-icons/master/svg/color/usdt.svg' },
      { symbol: 'USDC', name: 'USD Coin', address: '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174', decimals: 6, isNative: false, logo: 'https://raw.githubusercontent.com/spothq/cryptocurrency-icons/master/svg/color/usdc.svg' },
    ],
  },
  bsc: {
    chainId: 56,
    name: 'Binance Smart Chain',
    rpcUrl: () => process.env.BSC_RPC_URL || 'https://rpc.ankr.com/bsc',
    nativeSymbol: 'BNB',
    tokens: [
      { symbol: 'BNB', name: 'BNB', address: '', decimals: 18, isNative: true, logo: 'https://raw.githubusercontent.com/spothq/cryptocurrency-icons/master/svg/color/bnb.svg' },
      { symbol: 'USDT', name: 'Tether USD', address: '0x55d398326f99059fF775485246999027B3197955', decimals: 18, isNative: false, logo: 'https://raw.githubusercontent.com/spothq/cryptocurrency-icons/master/svg/color/usdt.svg' },
      { symbol: 'USDC', name: 'USD Coin', address: '0x8ac76a51cc950d9822d68b83fe1ad97b32cd580d', decimals: 18, isNative: false, logo: 'https://raw.githubusercontent.com/spothq/cryptocurrency-icons/master/svg/color/usdc.svg' },
    ],
  },
};

function getTokenListStatic(chainKey) {
  return CHAINS[chainKey]?.tokens || [];
}

function getChain(chainKey) {
  const chain = CHAINS[chainKey];
  if (!chain) throw new Error('Unknown chain');
  const rpcUrl = chain.rpcUrl();
  if (rpcUrl.includes('undefined') || rpcUrl.includes('null')) {
    throw new Error('RPC URL not set');
  }
  return { ...chain, rpcUrl };
}

function getProvider(chainKey) {
  if (chainKey === 'bsc') {
    // Pakai provider dari env khusus BSC
    return new JsonRpcProvider(process.env.BSC_RPC_URL || 'https://rpc.ankr.com/bsc');
  }
  const chain = getChain(chainKey);
  return new JsonRpcProvider(chain.rpcUrl);
}

function getTokenList(chainKey) {
  const chain = getChain(chainKey);
  return chain.tokens;
}

// Token groups untuk merge dan sorting
const TOKEN_GROUPS = {
  NATIVE_TOKENS: ['ETH', 'BNB', 'MATIC'],
  MERGED_TOKENS: ['USDT', 'USDC'],
};

// Helper untuk cek apakah token perlu di-merge
function shouldMergeToken(symbol) {
  return TOKEN_GROUPS.MERGED_TOKENS.includes(symbol);
}

// Helper untuk cek apakah token adalah native token
function isNativeToken(symbol) {
  return TOKEN_GROUPS.NATIVE_TOKENS.includes(symbol);
}

// Helper untuk mendapatkan token priority untuk sorting
function getTokenPriority(symbol) {
  if (TOKEN_GROUPS.NATIVE_TOKENS.includes(symbol)) return 1;
  if (TOKEN_GROUPS.MERGED_TOKENS.includes(symbol)) return 2;
  return 3;
}

module.exports = {
  CHAINS,
  TOKEN_GROUPS,
  shouldMergeToken,
  isNativeToken,
  getTokenPriority,
  getChain,
  getProvider,
  getTokenList,
  getTokenListStatic,
}; 