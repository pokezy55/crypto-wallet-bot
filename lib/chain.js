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
      },
      {
        symbol: 'USDC',
        name: 'USD Coin',
        decimals: 6,
        isNative: false,
        address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
        logo: 'https://raw.githubusercontent.com/spothq/cryptocurrency-icons/master/svg/color/usdc.svg'
      },
      {
        symbol: 'Wrapped Bitcoin',
        name: 'WBTC',
        decimals: 6,
        isNative: false,
        address: '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599',
        logo: 'https://raw.githubusercontent.com/spothq/cryptocurrency-icons/master/svg/color/wbtc.svg'
      },
      {
        symbol: 'Chainlink',
        name: 'LINK',
        decimals: 6,
        isNative: false,
        address: '0x514910771AF9Ca65E365357d1743Ef8fA8AacEfE',
        logo: 'https://raw.githubusercontent.com/spothq/cryptocurrency-icons/master/svg/color/link.svg'
      },
      {
        symbol: 'Aave',
        name: 'AAVE',
        decimals: 6,
        isNative: false,
        address: '0x7Fc66500cEAb8Ccde615bF154d85B5B8DfB0eAA9',
        logo: 'https://raw.githubusercontent.com/spothq/cryptocurrency-icons/master/svg/color/aave.svg'
      },
      {
        symbol: 'Pepe',
        name: 'PEPE',
        decimals: 6,
        isNative: false,
        address: '0x6982508145454Ce325dDbE47a25d4ec3d2311933',
        logo: 'https://raw.githubusercontent.com/spothq/cryptocurrency-icons/master/svg/color/pepe.svg'
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
      },
      {
        symbol: 'USDC',
        name: 'USD Coin',
        decimals: 6,
        isNative: false,
        address: '0x8AC76a51Cc950d9822D68b83FEa1Ad7b0d9E7bA2',
        logo: 'https://raw.githubusercontent.com/spothq/cryptocurrency-icons/master/svg/color/usdc.svg'
      },
      {
        symbol: 'Dogecoin',
        name: 'DOGE',
        decimals: 6,
        isNative: false,
        address: '0xbA2ae424d960c26247Dd6c32edC70B295c744C43',
        logo: 'https://raw.githubusercontent.com/spothq/cryptocurrency-icons/master/svg/color/doge.svg'
      },
      {
        symbol: 'Chainlink',
        name: 'LINK',
        decimals: 6,
        isNative: false,
        address: '0xF8A0BF9cf54FcD9D267935Ebc6Fbe75c4DcD6f0a',
        logo: 'https://raw.githubusercontent.com/spothq/cryptocurrency-icons/master/svg/color/link.svg'
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
      },
      {
        symbol: 'USDC',
        name: 'USD Coin',
        decimals: 6,
        isNative: false,
        address: '0x2791Bca1f2de4661ED88A30C99A7a9214Ef89bc7',
        logo: 'https://raw.githubusercontent.com/spothq/cryptocurrency-icons/master/svg/color/usdc.svg'
      },
      {
        symbol: 'Wrapped Bitcoin',
        name: 'WBTC',
        decimals: 6,
        isNative: false,
        address: '0x1BFD67037B42Cf73FcD5D67ae5FaC2fBA0bAAb8f',
        logo: 'https://raw.githubusercontent.com/spothq/cryptocurrency-icons/master/svg/color/wbtc.svg'
      },
      {
        symbol: 'Uniswap',
        name: 'UNI',
        decimals: 6,
        isNative: false,
        address: '0xb33EaAD8d148D1e82F5D7E1a37cEc2Bcc357c91d',
        logo: 'https://cryptologos.cc/logos/uniswap-uni-logo.svg?v=040'
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
        logo: 'https://raw.githubusercontent.com/spothq/cryptocurrency-icons/master/svg/color/base.svg'
      },
      {
        symbol: 'USDC',
        name: 'USD Coin',
        decimals: 6,
        isNative: false,
        address: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
        logo: 'https://raw.githubusercontent.com/spothq/cryptocurrency-icons/master/svg/color/usdc.svg'
      },
      {
        symbol: 'Dai',
        name: 'DAI',
        decimals: 6,
        isNative: false,
        address: '0x50c5725949A6F0c72E6C4a641aCc2eAa7c1cF5c3',
        logo: 'https://raw.githubusercontent.com/spothq/cryptocurrency-icons/master/svg/color/dai.svg'
      },
      {
        symbol: 'Brett',
        name: 'BRETT',
        decimals: 6,
        isNative: false,
        address: '0x532f27101965ddfA0f7f6f4eB288fDbc93d1999D',
        logo: 'https://cryptologos.cc/logos/based-brett-brett-logo.svg?v=040'
      },
      {
        symbol: 'Compound',
        name: 'COMP',
        decimals: 6,
        isNative: false,
        address: '0x336829107955F11429402C82352B5aEa8581f185',
        logo: 'https://cryptologos.cc/logos/compound-comp-logo.svg?v=040'
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
export async function getSigner(chain, seedPhrase, privateKey) {
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

    // For Telegram WebApp or when MetaMask is not available
    if (privateKey) {
      return new Wallet(privateKey, provider);
    }

    if (seedPhrase) {
      return Wallet.fromPhrase(seedPhrase).connect(provider);
    }

    throw new Error('Please connect your wallet or import your account to send transactions');
  } catch (error) {
    console.error('Failed to get signer:', error);
    throw error;
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