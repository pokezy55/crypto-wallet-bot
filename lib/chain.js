import { JsonRpcProvider, BrowserProvider, Wallet } from 'ethers';
import { ethers } from 'ethers';

export const TOKEN_GROUPS = {
  STABLECOINS: ['USDT', 'USDC', 'USDbC', 'BUSD', 'DAI'],
  NATIVE: ['ETH', 'BNB', 'MATIC']
};

// All ERC20 addresses below are EIP-55 checksum (required for ethers.js)
export const CHAINS = {
  base: {
    chainId: 8453,
    name: "Base",
    rpcUrl: process.env.BASE_RPC_URL,
    nativeCurrency: { name: "ETH", symbol: "ETH", decimals: 18 },
    tokens: [
      { symbol: "ETH", name: "Ethereum", decimals: 18, logo: "https://assets.coingecko.com/coins/images/279/large/ethereum.png", priceId: "ethereum" },
      { symbol: "USDC", name: "USD Coin", address: "0x833589fCD6eDb6E08f4c7C3ED9EbF0bF733aBfF4", decimals: 6, logo: "https://assets.coingecko.com/coins/images/6319/large/USD_Coin_icon.png", priceId: "usd-coin" },
      { symbol: "WETH", name: "Wrapped Ether", address: "0x4200000000000000000000000000000000000006", decimals: 18, logo: "https://assets.coingecko.com/coins/images/2518/large/weth.png", priceId: "weth" },
      { symbol: "DAI", name: "Dai", address: "0x50c5725949A6F0c72E6C4a641aCc2eAa7c1cF5c3", decimals: 18, logo: "https://assets.coingecko.com/coins/images/9956/large/4943.png", priceId: "dai" },
      { symbol: "WSTETH", name: "Wrapped stETH", address: "0xf246E632870E28F731C5000494480E6130B925B0", decimals: 18, logo: "https://assets.coingecko.com/coins/images/18834/large/wstETH.png", priceId: "wrapped-steth" },
      { symbol: "AERO", name: "Aerodrome Finance", address: "0x940181a94A35A4569E4529A3CDfB74e38Fd98631", decimals: 18, logo: "https://assets.coingecko.com/coins/images/30981/large/aero.png", priceId: "aerodrome-finance" },
      { symbol: "BRETT", name: "Brett", address: "0x532F27101965DDfA0F7F6f4EB288FDbC93D1999D", decimals: 18, logo: "https://assets.coingecko.com/coins/images/30996/large/brett.png", priceId: "brett" },
      { symbol: "TOSHI", name: "Toshi", address: "0x34D21BfD9E365D06540307040D6E7C064E43A9A7", decimals: 18, logo: "https://assets.coingecko.com/coins/images/30994/large/toshi.png", priceId: "toshi" },
      { symbol: "CAKE", name: "PancakeSwap", address: "0x3d41868478D6B8344E21A224eD52E9F7FF87F4C9", decimals: 18, logo: "https://assets.coingecko.com/coins/images/12632/large/pancakeswap-cake-logo.png", priceId: "pancakeswap-token" },
      { symbol: "COMP", name: "Compound", address: "0x336829107955F11429402C82352B5aEa8581f185", decimals: 18, logo: "https://assets.coingecko.com/coins/images/10775/large/COMP.png", priceId: "compound-governance-token" },
      { symbol: "AXL", name: "Axelar", address: "0x323C2A6D179c3d4B4C1Dc2fD6A35F8E16091217E", decimals: 18, logo: "https://assets.coingecko.com/coins/images/24466/large/axl.png", priceId: "axelar" }
    ],
  },
  ethereum: {
    chainId: 1,
    name: "Ethereum",
    rpcUrl: process.env.ETH_RPC_URL,
    nativeCurrency: { name: "Ethereum", symbol: "ETH", decimals: 18 },
    tokens: [
      { symbol: "ETH", name: "Ethereum", decimals: 18, logo: "https://assets.coingecko.com/coins/images/279/large/ethereum.png", priceId: "ethereum" },
      { symbol: "USDT", name: "Tether", address: "0xdAC17F958D2ee523a2206206994597C13D831ec7", decimals: 6, logo: "https://assets.coingecko.com/coins/images/325/large/Tether.png", priceId: "tether" },
      { symbol: "USDC", name: "USD Coin", address: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48", decimals: 6, logo: "https://assets.coingecko.com/coins/images/6319/large/USD_Coin_icon.png", priceId: "usd-coin" },
      { symbol: "WBTC", name: "Wrapped Bitcoin", address: "0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599", decimals: 8, logo: "https://assets.coingecko.com/coins/images/7598/large/wrapped_bitcoin_wbtc.png", priceId: "wrapped-bitcoin" },
      { symbol: "LINK", name: "Chainlink", address: "0x514910771AF9Ca65E365357d1743Ef8fA8AacEfE", decimals: 18, logo: "https://assets.coingecko.com/coins/images/877/large/chainlink-new-logo.png", priceId: "chainlink" },
      { symbol: "SHIB", name: "Shiba Inu", address: "0x95aD61b0a150d79219dCEa232fB6a54855EaEd4b", decimals: 18, logo: "https://assets.coingecko.com/coins/images/11939/large/shiba.png", priceId: "shiba-inu" },
      { symbol: "UNI", name: "Uniswap", address: "0x1f9840a85d5AF5bf1D1762F925BDADdC4201F984", decimals: 18, logo: "https://assets.coingecko.com/coins/images/12504/large/uniswap-uni.png", priceId: "uniswap" },
      { symbol: "DAI", name: "Dai", address: "0x6B175474E89094C44Da98b954EedeAC495271d0F", decimals: 18, logo: "https://assets.coingecko.com/coins/images/9956/large/4943.png", priceId: "dai" },
      { symbol: "AAVE", name: "Aave", address: "0x7Fc66500cEAb8Ccde615bF154d85B5B8DfB0eAA9", decimals: 18, logo: "https://assets.coingecko.com/coins/images/12645/large/AAVE.png", priceId: "aave" },
      { symbol: "PEPE", name: "Pepe", address: "0x6982508145454Ce325dDbE47a25d4ec3d2311933", decimals: 18, logo: "https://assets.coingecko.com/coins/images/29850/large/pepe-token.jpeg", priceId: "pepe" }
    ],
  },
  polygon: {
    chainId: 137,
    name: "Polygon",
    rpcUrl: process.env.POLYGON_RPC_URL,
    nativeCurrency: { name: "Polygon", symbol: "MATIC", decimals: 18 },
    tokens: [
      { symbol: "MATIC", name: "Polygon", decimals: 18, logo: "https://assets.coingecko.com/coins/images/4713/large/matic-token-icon.png", priceId: "matic-network" },
      { symbol: "USDC", name: "USD Coin", address: "0x2791Bca1f2de4661ED88A30C99A7a9214Ef89bc7", decimals: 6, logo: "https://assets.coingecko.com/coins/images/6319/large/USD_Coin_icon.png", priceId: "usd-coin" },
      { symbol: "USDT", name: "Tether", address: "0xc2132D05D31c914a87C66119CFAf01602Fad7D2e", decimals: 6, logo: "https://assets.coingecko.com/coins/images/325/large/Tether.png", priceId: "tether" },
      { symbol: "WBTC", name: "Wrapped Bitcoin", address: "0x1BFD67037B42Cf73FcD5D67ae5FaC2fBA0bAAb8f", decimals: 8, logo: "https://assets.coingecko.com/coins/images/7598/large/wrapped_bitcoin_wbtc.png", priceId: "wrapped-bitcoin" },
      { symbol: "WETH", name: "Wrapped Ether", address: "0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619", decimals: 18, logo: "https://assets.coingecko.com/coins/images/2518/large/weth.png", priceId: "weth" },
      { symbol: "DAI", name: "Dai", address: "0x8f3Cf7ad23Cd3CaDbD9735Fd580221Ae39a6e51c", decimals: 18, logo: "https://assets.coingecko.com/coins/images/9956/large/4943.png", priceId: "dai" },
      { symbol: "LINK", name: "Chainlink", address: "0x53E0bca35eC356BD5FD4deACD5ab448fCda4Dbb9", decimals: 18, logo: "https://assets.coingecko.com/coins/images/877/large/chainlink-new-logo.png", priceId: "chainlink" },
      { symbol: "AAVE", name: "Aave", address: "0xD6DF932A45C0f255f85145c42f15749f78Fc54A5", decimals: 18, logo: "https://assets.coingecko.com/coins/images/12645/large/AAVE.png", priceId: "aave" },
      { symbol: "UNI", name: "Uniswap", address: "0xb33EaAD8d148D1e82F5D7E1a37cEc2Bcc357c91d", decimals: 18, logo: "https://assets.coingecko.com/coins/images/12504/large/uniswap-uni.png", priceId: "uniswap" },
      { symbol: "RENDER", name: "Render", address: "0x28a2a4bBC00808b868eB31a89c7d8129B78484aD", decimals: 18, logo: "https://assets.coingecko.com/coins/images/11636/large/rndr.png", priceId: "render-token" }
    ],
  },
  bsc: {
    chainId: 56,
    name: "BNB Smart Chain",
    rpcUrl: process.env.BSC_RPC_URL,
    nativeCurrency: { name: "BNB", symbol: "BNB", decimals: 18 },
    tokens: [
      { symbol: "BNB", name: "BNB", decimals: 18, logo: "https://assets.coingecko.com/coins/images/825/large/binance-coin-logo.png", priceId: "binancecoin" },
      { symbol: "USDC", name: "USD Coin", address: "0x8AC76a51Cc950d9822D68b83FEa1Ad7b0d9E7bA2", decimals: 18, logo: "https://assets.coingecko.com/coins/images/6319/large/USD_Coin_icon.png", priceId: "usd-coin" },
      { symbol: "USDT", name: "Tether", address: "0x55d398326f99059fF775485246999027B3197955", decimals: 18, logo: "https://assets.coingecko.com/coins/images/325/large/Tether.png", priceId: "tether" },
      { symbol: "WETH", name: "Wrapped Ether", address: "0x2170Ed0880ac9A755fd29B268895fBff2fB23a78", decimals: 18, logo: "https://assets.coingecko.com/coins/images/2518/large/weth.png", priceId: "weth" },
      { symbol: "CAKE", name: "PancakeSwap", address: "0x0E09FaBB73Bd3Ade0a17ECC321fD13a19e81cE82", decimals: 18, logo: "https://assets.coingecko.com/coins/images/12632/large/pancakeswap-cake-logo.png", priceId: "pancakeswap-token" },
      { symbol: "DOGE", name: "Dogecoin", address: "0xbA2ae424d960c26247Dd6c32edC70B295c744C43", decimals: 18, logo: "https://assets.coingecko.com/coins/images/5/large/dogecoin.png", priceId: "dogecoin" },
      { symbol: "SHIB", name: "Shiba Inu", address: "0x2859e4544C526B0E65fbc1e5FD2f0B3D2F9f0Cf4", decimals: 18, logo: "https://assets.coingecko.com/coins/images/11939/large/shiba.png", priceId: "shiba-inu" },
      { symbol: "LINK", name: "Chainlink", address: "0xF8A0BF9cf54FcD9D267935Ebc6Fbe75c4DcD6f0a", decimals: 18, logo: "https://assets.coingecko.com/coins/images/877/large/chainlink-new-logo.png", priceId: "chainlink" },
      { symbol: "UNI", name: "Uniswap", address: "0xbf5140A227752Fe610f6Bf6DcbD0759f08fD5cAb", decimals: 18, logo: "https://assets.coingecko.com/coins/images/12504/large/uniswap-uni.png", priceId: "uniswap" },
      { symbol: "FLOKI", name: "Floki", address: "0xfB5B838b6fAEC6DbeF2D6962dfFcE49a3B876Abb", decimals: 18, logo: "https://assets.coingecko.com/coins/images/16746/large/Floki.png", priceId: "floki" }
    ],
  },
};

// At config load, validate all ERC20 addresses with ethers.utils.getAddress. If invalid, log and skip.
Object.values(CHAINS).forEach(chain => {
  chain.tokens = chain.tokens.filter(token => {
    if (token.address) {
      try {
        token.address = ethers.getAddress(token.address);
        return true;
      } catch (e) {
        console.warn('Invalid ERC20 address in config, skipping:', token.symbol, token.address, e.message);
        return false;
      }
    }
    return true;
  });
});

// Provider cache
const providers = {};

// Get provider with fallback
export function getProvider(chain) {
  const chainConfig = CHAINS[chain];
  if (!chainConfig) {
    throw new Error(`Unsupported chain: ${chain}`);
}

  // Log rpcUrl yang dipakai
  if (!chainConfig.rpcUrl) {
    console.error(`ERROR: rpcUrl for chain '${chain}' is not set! Please set the environment variable for this chain.`);
    throw new Error(`rpcUrl for chain '${chain}' is not set!`);
  } else {
    console.log(`Using rpcUrl for chain '${chain}':`, chainConfig.rpcUrl);
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
    providers[chain] = new JsonRpcProvider(chainConfig.rpcUrl);
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