const { JsonRpcProvider } = require('ethers');

export const CHAINS = {
  eth: {
    chainId: 1,
    name: 'Ethereum',
    rpcUrl: () => process.env.NEXT_PUBLIC_ETH_RPC_URL || 'https://eth-mainnet.g.alchemy.com/v2/',
    native: {
      symbol: 'ETH',
      name: 'Ethereum',
      logo: 'https://raw.githubusercontent.com/spothq/cryptocurrency-icons/master/svg/color/eth.svg'
    },
    logo: 'https://raw.githubusercontent.com/spothq/cryptocurrency-icons/master/svg/color/eth.svg',
    tokens: [
      {
        symbol: 'ETH',
        name: 'Ethereum',
        address: '',
        decimals: 18,
        isNative: true,
        logo: 'https://raw.githubusercontent.com/spothq/cryptocurrency-icons/master/svg/color/eth.svg'
      },
      {
        symbol: 'USDT',
        name: 'Tether USD',
        address: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
        decimals: 6,
        isNative: false,
        logo: 'https://raw.githubusercontent.com/spothq/cryptocurrency-icons/master/svg/color/usdt.svg'
      },
      {
        symbol: 'USDC',
        name: 'USD Coin',
        address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
        decimals: 6,
        isNative: false,
        logo: 'https://raw.githubusercontent.com/spothq/cryptocurrency-icons/master/svg/color/usdc.svg'
      }
    ]
  },
  base: {
    chainId: 8453,
    name: 'Base',
    rpcUrl: () => process.env.NEXT_PUBLIC_BASE_RPC_URL || 'https://base-mainnet.g.alchemy.com/v2/',
    native: {
      symbol: 'ETH',
      name: 'Base ETH',
      logo: 'https://raw.githubusercontent.com/spothq/cryptocurrency-icons/master/svg/color/eth.svg'
    },
    logo: 'https://raw.githubusercontent.com/spothq/cryptocurrency-icons/master/svg/color/eth.svg',
    tokens: [
      {
        symbol: 'ETH',
        name: 'Base ETH',
        address: '',
        decimals: 18,
        isNative: true,
        logo: 'https://raw.githubusercontent.com/spothq/cryptocurrency-icons/master/svg/color/eth.svg'
      },
      {
        symbol: 'USDT',
        name: 'Tether USD',
        address: '0xA7D9ddBE1f17865597fBD27EC712455208B6b76D',
        decimals: 6,
        isNative: false,
        logo: 'https://raw.githubusercontent.com/spothq/cryptocurrency-icons/master/svg/color/usdt.svg'
      },
      {
        symbol: 'USDC',
        name: 'USD Coin',
        address: '0xd9AAEC86B65d86f6A7B5B1b0c42FFA531710b6CA',
        decimals: 6,
        isNative: false,
        logo: 'https://raw.githubusercontent.com/spothq/cryptocurrency-icons/master/svg/color/usdc.svg'
      }
    ]
  },
  polygon: {
    chainId: 137,
    name: 'Polygon',
    rpcUrl: () => process.env.NEXT_PUBLIC_POLYGON_RPC_URL || 'https://polygon-mainnet.g.alchemy.com/v2/',
    native: {
      symbol: 'MATIC',
      name: 'Polygon',
      logo: 'https://raw.githubusercontent.com/spothq/cryptocurrency-icons/master/svg/color/matic.svg'
    },
    logo: 'https://raw.githubusercontent.com/spothq/cryptocurrency-icons/master/svg/color/matic.svg',
    tokens: [
      {
        symbol: 'MATIC',
        name: 'Polygon',
        address: '',
        decimals: 18,
        isNative: true,
        logo: 'https://raw.githubusercontent.com/spothq/cryptocurrency-icons/master/svg/color/matic.svg'
      },
      {
        symbol: 'USDT',
        name: 'Tether USD',
        address: '0x3813e82e6f7098b9583FC0F33a962D02018B6803',
        decimals: 6,
        isNative: false,
        logo: 'https://raw.githubusercontent.com/spothq/cryptocurrency-icons/master/svg/color/usdt.svg'
      },
      {
        symbol: 'USDC',
        name: 'USD Coin',
        address: '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174',
        decimals: 6,
        isNative: false,
        logo: 'https://raw.githubusercontent.com/spothq/cryptocurrency-icons/master/svg/color/usdc.svg'
      }
    ]
  },
  bsc: {
    chainId: 56,
    name: 'BNB Smart Chain',
    rpcUrl: () => process.env.NEXT_PUBLIC_BSC_RPC_URL || 'https://bsc-dataseed1.binance.org',
    native: {
      symbol: 'BNB',
      name: 'BNB',
      logo: 'https://raw.githubusercontent.com/spothq/cryptocurrency-icons/master/svg/color/bnb.svg'
    },
    logo: 'https://raw.githubusercontent.com/spothq/cryptocurrency-icons/master/svg/color/bnb.svg',
    tokens: [
      {
        symbol: 'BNB',
        name: 'BNB',
        address: '',
        decimals: 18,
        isNative: true,
        logo: 'https://raw.githubusercontent.com/spothq/cryptocurrency-icons/master/svg/color/bnb.svg'
      },
      {
        symbol: 'USDT',
        name: 'Tether USD',
        address: '0x55d398326f99059fF775485246999027B3197955',
        decimals: 18,
        isNative: false,
        logo: 'https://raw.githubusercontent.com/spothq/cryptocurrency-icons/master/svg/color/usdt.svg'
      },
      {
        symbol: 'USDC',
        name: 'USD Coin',
        address: '0x8ac76a51cc950d9822d68b83fe1ad97b32cd580d',
        decimals: 18,
        isNative: false,
        logo: 'https://raw.githubusercontent.com/spothq/cryptocurrency-icons/master/svg/color/usdc.svg'
      }
    ]
  }
};

export const TOKEN_GROUPS = {
  stablecoins: ['USDT', 'USDC']
};

export function shouldMergeToken(symbol) {
  return TOKEN_GROUPS.stablecoins.includes(symbol);
}

export function getTokenPriority(token) {
  if (token.isNative) return 0;
  if (TOKEN_GROUPS.stablecoins.includes(token.symbol)) return 1;
  return 2;
}

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

module.exports = {
  CHAINS,
  TOKEN_GROUPS,
  shouldMergeToken,
  getTokenPriority,
  getChain,
  getProvider,
  getTokenList,
  getTokenListStatic,
}; 