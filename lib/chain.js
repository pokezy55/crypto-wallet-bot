import { JsonRpcProvider, BrowserProvider } from 'ethers';

export const TOKEN_GROUPS = {
  stablecoins: ['USDT', 'USDC'],
  native_tokens: ['ETH', 'BNB', 'MATIC']
};

const CHAINS = {
  eth: {
    name: 'Ethereum',
    rpc: process.env.ETH_RPC_URL || 'https://eth.llamarpc.com',
    explorer: 'https://etherscan.io',
    tokens: [
      {
        symbol: 'ETH',
        name: 'Ethereum',
        decimals: 18,
        isNative: true,
        logo: 'https://raw.githubusercontent.com/spothq/cryptocurrency-icons/master/svg/color/eth.svg'
      },
      {
        symbol: 'USDT',
        name: 'Tether USD',
        decimals: 6,
        isNative: false,
        address: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
        logo: 'https://raw.githubusercontent.com/spothq/cryptocurrency-icons/master/svg/color/usdt.svg'
      }
    ]
  },
  bsc: {
    name: 'BSC',
    rpc: process.env.BSC_RPC_URL || 'https://bsc-dataseed.binance.org',
    explorer: 'https://bscscan.com',
    tokens: [
      {
        symbol: 'BNB',
        name: 'BNB',
        decimals: 18,
        isNative: true,
        logo: 'https://raw.githubusercontent.com/spothq/cryptocurrency-icons/master/svg/color/bnb.svg'
      },
      {
        symbol: 'USDT',
        name: 'Tether USD',
        decimals: 18,
        isNative: false,
        address: '0x55d398326f99059fF775485246999027B3197955',
        logo: 'https://raw.githubusercontent.com/spothq/cryptocurrency-icons/master/svg/color/usdt.svg'
      }
    ]
  },
  polygon: {
    name: 'Polygon',
    rpc: process.env.POLYGON_RPC_URL || 'https://polygon-rpc.com',
    explorer: 'https://polygonscan.com',
    tokens: [
      {
        symbol: 'MATIC',
        name: 'Polygon',
        decimals: 18,
        isNative: true,
        logo: 'https://raw.githubusercontent.com/spothq/cryptocurrency-icons/master/svg/color/matic.svg'
      },
      {
        symbol: 'USDT',
        name: 'Tether USD',
        decimals: 6,
        isNative: false,
        address: '0xc2132D05D31c914a87C6611C10748AEb04B58e8F',
        logo: 'https://raw.githubusercontent.com/spothq/cryptocurrency-icons/master/svg/color/usdt.svg'
      }
    ]
  },
  base: {
    name: 'Base',
    rpc: process.env.BASE_RPC_URL || 'https://mainnet.base.org',
    explorer: 'https://basescan.org',
    tokens: [
      {
        symbol: 'ETH',
        name: 'Base ETH',
        decimals: 18,
        isNative: true,
        logo: 'https://raw.githubusercontent.com/spothq/cryptocurrency-icons/master/svg/color/eth.svg'
      },
      {
        symbol: 'USDC',
        name: 'USD Coin',
        decimals: 6,
        isNative: false,
        address: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
        logo: 'https://raw.githubusercontent.com/spothq/cryptocurrency-icons/master/svg/color/usdc.svg'
      }
    ]
  }
};

// Provider cache
const providers = {};

export function getProvider(chain) {
  const chainConfig = CHAINS[chain];
  if (!chainConfig) {
    throw new Error(`Unsupported chain: ${chain}`);
  }

  // Return cached provider if exists
  if (providers[chain]) {
    return providers[chain];
  }

  // Create new provider
  try {
    // Use BrowserProvider for browser environment
    if (typeof window !== 'undefined') {
      // For Base chain
      if (chain === 'base') {
        providers[chain] = new BrowserProvider(window.ethereum);
      }
      // For other chains
      else {
        providers[chain] = new JsonRpcProvider(chainConfig.rpc);
      }
    }
    // Use JsonRpcProvider for server environment
    else {
      providers[chain] = new JsonRpcProvider(chainConfig.rpc);
    }

    return providers[chain];
  } catch (error) {
    console.error(`Failed to create provider for chain ${chain}:`, error);
    throw new Error(`Failed to connect to ${chainConfig.name}`);
  }
}

export function getTokenList(chain) {
  return CHAINS[chain]?.tokens || [];
}

export function getChainConfig(chain) {
  return CHAINS[chain];
}

export function getChainList() {
  return Object.entries(CHAINS).map(([id, config]) => ({
    id,
    ...config
  }));
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