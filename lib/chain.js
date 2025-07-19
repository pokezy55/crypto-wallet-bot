const { JsonRpcProvider } = require('ethers');

export const TOKEN_GROUPS = {
  stablecoins: ['USDT', 'USDC'],
  native_tokens: ['ETH', 'BNB', 'MATIC']
};

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
        logo: 'https://raw.githubusercontent.com/spothq/cryptocurrency-icons/master/svg/color/eth.svg',
        isNative: true,
        decimals: 18,
        chains: ['ETH'],
        priceUSD: 0,
        priceChange24h: 0
      },
      {
        symbol: 'USDT',
        name: 'Tether USD',
        logo: 'https://raw.githubusercontent.com/spothq/cryptocurrency-icons/master/svg/color/usdt.svg',
        address: '0xdac17f958d2ee523a2206206994597c13d831ec7',
        decimals: 6,
        isNative: false,
        chains: ['ETH'],
        priceUSD: 0,
        priceChange24h: 0
      },
      {
        symbol: 'USDC',
        name: 'USD Coin',
        logo: 'https://raw.githubusercontent.com/spothq/cryptocurrency-icons/master/svg/color/usdc.svg',
        address: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
        decimals: 6,
        isNative: false,
        chains: ['ETH'],
        priceUSD: 0,
        priceChange24h: 0
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
        logo: 'https://raw.githubusercontent.com/spothq/cryptocurrency-icons/master/svg/color/bnb.svg',
        isNative: true,
        decimals: 18,
        chains: ['BSC'],
        priceUSD: 0,
        priceChange24h: 0
      },
      {
        symbol: 'USDT',
        name: 'Tether USD',
        logo: 'https://raw.githubusercontent.com/spothq/cryptocurrency-icons/master/svg/color/usdt.svg',
        address: '0x55d398326f99059ff775485246999027b3197955',
        decimals: 18,
        isNative: false,
        chains: ['BSC'],
        priceUSD: 0,
        priceChange24h: 0
      },
      {
        symbol: 'USDC',
        name: 'USD Coin',
        logo: 'https://raw.githubusercontent.com/spothq/cryptocurrency-icons/master/svg/color/usdc.svg',
        address: '0x8ac76a51cc950d9822d68b83fe1ad97b32cd580d',
        decimals: 18,
        isNative: false,
        chains: ['BSC'],
        priceUSD: 0,
        priceChange24h: 0
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
        logo: 'https://raw.githubusercontent.com/spothq/cryptocurrency-icons/master/svg/color/matic.svg',
        isNative: true,
        decimals: 18,
        chains: ['POLYGON'],
        priceUSD: 0,
        priceChange24h: 0
      },
      {
        symbol: 'USDT',
        name: 'Tether USD',
        logo: 'https://raw.githubusercontent.com/spothq/cryptocurrency-icons/master/svg/color/usdt.svg',
        address: '0xc2132d05d31c914a87c6611c10748aeb04b58e8f',
        decimals: 6,
        isNative: false,
        chains: ['POLYGON'],
        priceUSD: 0,
        priceChange24h: 0
      },
      {
        symbol: 'USDC',
        name: 'USD Coin',
        logo: 'https://raw.githubusercontent.com/spothq/cryptocurrency-icons/master/svg/color/usdc.svg',
        address: '0x2791bca1f2de4661ed88a30c99a7a9449aa84174',
        decimals: 6,
        isNative: false,
        chains: ['POLYGON'],
        priceUSD: 0,
        priceChange24h: 0
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
        logo: 'https://raw.githubusercontent.com/spothq/cryptocurrency-icons/master/svg/color/eth.svg',
        isNative: true,
        decimals: 18,
        chains: ['BASE'],
        priceUSD: 0,
        priceChange24h: 0
      },
      {
        symbol: 'USDC',
        name: 'USD Coin',
        logo: 'https://raw.githubusercontent.com/spothq/cryptocurrency-icons/master/svg/color/usdc.svg',
        address: '0x833589fcd6edb6e08f4c7c32d4f71b54bda02913',
        decimals: 6,
        isNative: false,
        chains: ['BASE'],
        priceUSD: 0,
        priceChange24h: 0
      }
    ]
  }
};

export function getChain(chainKey) {
  const chain = CHAINS[chainKey];
  if (!chain) throw new Error('Unknown chain');
  const rpcUrl = chain.rpcUrl();
  if (rpcUrl.includes('undefined') || rpcUrl.includes('null')) {
    throw new Error('RPC URL not set');
  }
  return { ...chain, rpcUrl };
}

export function getProvider(chainKey) {
  if (chainKey === 'bsc') {
    return new JsonRpcProvider(process.env.BSC_RPC_URL || 'https://rpc.ankr.com/bsc');
  }
  const chain = getChain(chainKey);
  return new JsonRpcProvider(chain.rpcUrl);
}

export function getTokenList(chain) {
  if (!CHAINS[chain]) {
    throw new Error(`Chain ${chain} not supported`);
  }
  return CHAINS[chain].tokens;
}

export function shouldMergeToken(symbol) {
  return TOKEN_GROUPS.stablecoins.includes(symbol.toUpperCase());
}

export function isNativeToken(symbol) {
  return Object.values(CHAINS).some(chain => 
    chain.nativeSymbol === symbol
  );
}

export function getTokenPriority(token) {
  if (token.isNative) return 0; // Native tokens first
  if (shouldMergeToken(token.symbol)) return 1; // Stablecoins second
  return 2; // Other tokens last
}

module.exports = {
  CHAINS,
  TOKEN_GROUPS,
  getChain,
  getProvider,
  getTokenList,
  shouldMergeToken,
  isNativeToken,
  getTokenPriority
}; 