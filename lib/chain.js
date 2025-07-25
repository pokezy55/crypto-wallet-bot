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
        symbol: 'WBTC',
        name: 'Wrapped Bitcoin',
        decimals: 6,
        isNative: false,
        address: '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599',
        logo: 'https://raw.githubusercontent.com/spothq/cryptocurrency-icons/master/svg/color/wbtc.svg'
      },
      {
        symbol: 'LINK',
        name: 'Chainlink',
        decimals: 6,
        isNative: false,
        address: '0x514910771AF9Ca656af840dff83E8264EcF986CA',
        logo: 'https://raw.githubusercontent.com/spothq/cryptocurrency-icons/master/svg/color/link.svg'
      },
      {
        symbol: 'AAVE',
        name: 'Aave',
        decimals: 6,
        isNative: false,
        address: '0x7Fc66500c84A76Ad7e9c93437bFc5Ac33E2DDaE9',
        logo: 'https://raw.githubusercontent.com/spothq/cryptocurrency-icons/master/svg/color/aave.svg'
      },
      {
        symbol: 'PEPE',
        name: 'Pepe',
        decimals: 6,
        isNative: false,
        address: '0x6982508145454Ce325dDbE47a25d4ec3d2311933',
        logo: 'https://altcoinsbox.com/wp-content/uploads/2023/09/pepe-token-logo.svg'
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
        address: '0x8965349fb649A33a30cbFDa057D8eC2C48AbE2A2',
        logo: 'https://raw.githubusercontent.com/spothq/cryptocurrency-icons/master/svg/color/usdc.svg'
      },
      {
        symbol: 'DOGE',
        name: 'Dogecoin',
        decimals: 6,
        isNative: false,
        address: '0xbA2aE424d960c26247Dd6c32edC70B295c744C43',
        logo: 'https://raw.githubusercontent.com/spothq/cryptocurrency-icons/master/svg/color/doge.svg'
      },
      {
        symbol: 'LINK',
        name: 'Chainlink',
        decimals: 6,
        isNative: false,
        address: '0xF8A0BF9cF54Bb92F17374d9e9A321E6a111a51bD',
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
        address: '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174',
        logo: 'https://raw.githubusercontent.com/spothq/cryptocurrency-icons/master/svg/color/usdc.svg'
      },
      {
        symbol: 'WBTC',
        name: 'Wrapped Bitcoin',
        decimals: 6,
        isNative: false,
        address: '0x1BFD67037B42Cf73acF2047067bd4F2C47D9BfD6',
        logo: 'https://raw.githubusercontent.com/spothq/cryptocurrency-icons/master/svg/color/wbtc.svg'
      },
      {
        symbol: 'UNI',
        name: 'Uniswap',
        decimals: 6,
        isNative: false,
        address: '0xb33EaAd8d922B1083446DC23f610c2567fB5180f',
        logo: 'https://altcoinsbox.com/wp-content/uploads/2022/12/uniswap-logo.svg'
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
        logo: 'https://altcoinsbox.com/wp-content/uploads/2023/02/base-logo-in-blue.svg'
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
        symbol: 'ZRO',
        name: 'Layerzero',
        decimals: 6,
        isNative: false,
        address: '0x6985884C4392D348587B19cb9eAAf157F13271cd',
        logo: 'https://cdn.brandfetch.io/idjCvC9dI1/theme/light/logo.svg?c=1dxbfHSJFAPEGdCLU4o5B'
      },
      {
        symbol: 'WETH',
        name: 'Wrapped Ether',
        decimals: 6,
        isNative: false,
        address: '0x4200000000000000000000000000000000000006',
        logo: 'https://raw.githubusercontent.com/Cryptofonts/cryptoicons/refs/heads/master/SVG/weth.svg'
      },
      {
        symbol: 'AERO',
        name: 'Aerodrome',
        decimals: 6,
        isNative: false,
        address: '0x940181a94A35A4569E4529A3CDfB74e38FD98631',
        logo: 'https://aero.drome.eth.limo/brand-kit/AERO/token.svg'
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