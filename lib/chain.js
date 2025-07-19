import { JsonRpcProvider, BrowserProvider, Wallet } from 'ethers';

export const TOKEN_GROUPS = {
  STABLECOINS: ['USDT', 'USDC', 'USDbC', 'BUSD', 'DAI'],
  NATIVE: ['ETH', 'BNB', 'MATIC']
};

export const CHAINS = {
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

// Get provider with fallback
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
    // Try using window.ethereum if available
    if (typeof window !== 'undefined' && window.ethereum) {
      try {
        providers[chain] = new BrowserProvider(window.ethereum);
        return providers[chain];
      } catch (error) {
        console.warn('Failed to create BrowserProvider, falling back to JsonRpcProvider:', error);
      }
    }

    // Fallback to JsonRpcProvider
    providers[chain] = new JsonRpcProvider(chainConfig.rpc);
    return providers[chain];
  } catch (error) {
    console.error(`Failed to create provider for chain ${chain}:`, error);
    throw new Error(`Failed to connect to ${chainConfig.name}`);
  }
}

// Get signer with fallback
export async function getSigner(chain, seedPhrase) {
  try {
    const provider = getProvider(chain);

    // Try using window.ethereum if available
    if (provider instanceof BrowserProvider) {
      try {
        return await provider.getSigner();
      } catch (error) {
        console.warn('Failed to get signer from BrowserProvider:', error);
      }
    }

    // Fallback to creating wallet from seed phrase
    if (!seedPhrase) {
      throw new Error('Seed phrase is required when MetaMask is not available');
    }

    const wallet = Wallet.fromPhrase(seedPhrase).connect(provider);
    return wallet;
  } catch (error) {
    console.error('Failed to get signer:', error);
    throw new Error('Failed to connect wallet. Please re-import or switch network.');
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
  return TOKEN_GROUPS.STABLECOINS.includes(symbol);
}

export function isNativeToken(symbol) {
  return TOKEN_GROUPS.NATIVE.includes(symbol);
}

export function getTokenPriority(token) {
  if (token.isNative) return 0;
  if (TOKEN_GROUPS.STABLECOINS.includes(token.symbol)) return 1;
  return 2;
} 