const { JsonRpcProvider } = require('ethers');

export const CHAINS = {
  eth: {
    chainId: 1,
    name: 'Ethereum',
    rpcUrl: () => `https://eth-mainnet.g.alchemy.com/v2/${process.env.ALCHEMY_API_KEY || process.env.NEXT_PUBLIC_ALCHEMY_API_KEY}`,
    nativeSymbol: 'ETH',
    tokens: [
      {
        symbol: 'ETH',
        name: 'Ethereum',
        logo: '/tokens/eth.svg',
        isNative: true,
        decimals: 18
      },
      {
        symbol: 'USDT',
        name: 'Tether USD',
        logo: '/tokens/usdt.svg',
        address: '0xdac17f958d2ee523a2206206994597c13d831ec7',
        decimals: 6
      },
      {
        symbol: 'USDC',
        name: 'USD Coin',
        logo: '/tokens/usdc.svg',
        address: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
        decimals: 6
      }
    ]
  },
  bsc: {
    chainId: 56,
    name: 'BNB Smart Chain',
    rpcUrl: () => process.env.BSC_RPC_URL || 'https://rpc.ankr.com/bsc',
    nativeSymbol: 'BNB',
    tokens: [
      {
        symbol: 'BNB',
        name: 'BNB',
        logo: '/tokens/bnb.svg',
        isNative: true,
        decimals: 18
      },
      {
        symbol: 'USDT',
        name: 'Tether USD',
        logo: '/tokens/usdt.svg',
        address: '0x55d398326f99059ff775485246999027b3197955',
        decimals: 18
      },
      {
        symbol: 'USDC',
        name: 'USD Coin',
        logo: '/tokens/usdc.svg',
        address: '0x8ac76a51cc950d9822d68b83fe1ad97b32cd580d',
        decimals: 18
      }
    ]
  },
  polygon: {
    chainId: 137,
    name: 'Polygon',
    rpcUrl: () => `https://polygon-mainnet.g.alchemy.com/v2/${process.env.ALCHEMY_API_KEY || process.env.NEXT_PUBLIC_ALCHEMY_API_KEY}`,
    nativeSymbol: 'MATIC',
    tokens: [
      {
        symbol: 'MATIC',
        name: 'Polygon',
        logo: '/tokens/matic.svg',
        isNative: true,
        decimals: 18
      },
      {
        symbol: 'USDT',
        name: 'Tether USD',
        logo: '/tokens/usdt.svg',
        address: '0xc2132d05d31c914a87c6611c10748aeb04b58e8f',
        decimals: 6
      },
      {
        symbol: 'USDC',
        name: 'USD Coin',
        logo: '/tokens/usdc.svg',
        address: '0x2791bca1f2de4661ed88a30c99a7a9449aa84174',
        decimals: 6
      }
    ]
  },
  base: {
    chainId: 8453,
    name: 'Base',
    rpcUrl: () => `https://base-mainnet.g.alchemy.com/v2/${process.env.ALCHEMY_API_KEY || process.env.NEXT_PUBLIC_ALCHEMY_API_KEY}`,
    nativeSymbol: 'ETH',
    tokens: [
      {
        symbol: 'ETH',
        name: 'Base ETH',
        logo: '/tokens/base.svg',
        isNative: true,
        decimals: 18
      },
      {
        symbol: 'USDC',
        name: 'USD Coin',
        logo: '/tokens/usdc.svg',
        address: '0x833589fcd6edb6e08f4c7c32d4f71b54bda02913',
        decimals: 6
      }
    ]
  }
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