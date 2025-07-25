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
      { symbol: "DAI", name: "Dai", address: "0x50C5725949A6F0C72E6C4A641ACC2EAA7C1CF5C3", decimals: 18, logo: "https://assets.coingecko.com/coins/images/9956/large/4943.png", priceId: "dai" },
      { symbol: "WSTETH", name: "Wrapped stETH", address: "0xF246E632870E28F731C5000494480E6130B925B0", decimals: 18, logo: "https://assets.coingecko.com/coins/images/18834/large/wstETH.png", priceId: "wrapped-steth" },
      { symbol: "AERO", name: "Aerodrome Finance", address: "0x940181A94A35A4569E4529A3CDFB74E38FD98631", decimals: 18, logo: "https://assets.coingecko.com/coins/images/30981/large/aero.png", priceId: "aerodrome-finance" },
      { symbol: "BRETT", name: "Brett", address: "0x532F27101965DDFA0F7F6F4EB288FDBC93D1999D", decimals: 18, logo: "https://assets.coingecko.com/coins/images/30996/large/brett.png", priceId: "brett" },
      { symbol: "TOSHI", name: "Toshi", address: "0x34D21BFD9E365D06540307040D6E7C064E43A9A7", decimals: 18, logo: "https://assets.coingecko.com/coins/images/30994/large/toshi.png", priceId: "toshi" },
      { symbol: "CAKE", name: "PancakeSwap", address: "0x3D41868478D6B8344E21A224ED52E9F7FF87F4C9", decimals: 18, logo: "https://assets.coingecko.com/coins/images/12632/large/pancakeswap-cake-logo.png", priceId: "pancakeswap-token" },
      { symbol: "COMP", name: "Compound", address: "0x336829107955F11429402C82352B5AEA8581F185", decimals: 18, logo: "https://assets.coingecko.com/coins/images/10775/large/COMP.png", priceId: "compound-governance-token" },
      { symbol: "AXL", name: "Axelar", address: "0x323C2A6D179C3D4B4C1DC2FD6A35F8E16091217E", decimals: 18, logo: "https://assets.coingecko.com/coins/images/24466/large/axl.png", priceId: "axelar" }
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
      { symbol: "USDC", name: "USD Coin", address: "0xA0b86991C6218B36C1D19D4A2E9EB0CE3606EB48", decimals: 6, logo: "https://assets.coingecko.com/coins/images/6319/large/USD_Coin_icon.png", priceId: "usd-coin" },
      { symbol: "WBTC", name: "Wrapped Bitcoin", address: "0x2260FAC5E5542A773AA44FBCFEDF7C193BC2C599", decimals: 8, logo: "https://assets.coingecko.com/coins/images/7598/large/wrapped_bitcoin_wbtc.png", priceId: "wrapped-bitcoin" },
      { symbol: "LINK", name: "Chainlink", address: "0x514910771AF9CA65E365357D1743EF8FA8AACEFE", decimals: 18, logo: "https://assets.coingecko.com/coins/images/877/large/chainlink-new-logo.png", priceId: "chainlink" },
      { symbol: "SHIB", name: "Shiba Inu", address: "0x95AD61B0A150D79219DCEA232FB6A54855EAED4B", decimals: 18, logo: "https://assets.coingecko.com/coins/images/11939/large/shiba.png", priceId: "shiba-inu" },
      { symbol: "UNI", name: "Uniswap", address: "0x1F9840A85D5AF5BF1D1762F925BDADDc4201F984", decimals: 18, logo: "https://assets.coingecko.com/coins/images/12504/large/uniswap-uni.png", priceId: "uniswap" },
      { symbol: "DAI", name: "Dai", address: "0x6B175474E89094C44DA98B954EEDEAC495271D0F", decimals: 18, logo: "https://assets.coingecko.com/coins/images/9956/large/4943.png", priceId: "dai" },
      { symbol: "AAVE", name: "Aave", address: "0x7FC66500CEAB8CCDE615BF154D85B5B8DFB0EAA9", decimals: 18, logo: "https://assets.coingecko.com/coins/images/12645/large/AAVE.png", priceId: "aave" },
      { symbol: "PEPE", name: "Pepe", address: "0x6982508145454CE325DDBE47A25D4EC3D2311933", decimals: 18, logo: "https://assets.coingecko.com/coins/images/29850/large/pepe-token.jpeg", priceId: "pepe" }
    ],
  },
  polygon: {
    chainId: 137,
    name: "Polygon",
    rpcUrl: process.env.POLYGON_RPC_URL,
    nativeCurrency: { name: "Polygon", symbol: "MATIC", decimals: 18 },
    tokens: [
      { symbol: "MATIC", name: "Polygon", decimals: 18, logo: "https://assets.coingecko.com/coins/images/4713/large/matic-token-icon.png", priceId: "matic-network" },
      { symbol: "USDC", name: "USD Coin", address: "0x2791Bca1F2de4661ED88A30C99A7a9214Ef89bc7", decimals: 6, logo: "https://assets.coingecko.com/coins/images/6319/large/USD_Coin_icon.png", priceId: "usd-coin" },
      { symbol: "USDT", name: "Tether", address: "0xC2132D05D31C914A87C66119CFAF01602FAD7D2E", decimals: 6, logo: "https://assets.coingecko.com/coins/images/325/large/Tether.png", priceId: "tether" },
      { symbol: "WBTC", name: "Wrapped Bitcoin", address: "0x1BFD67037B42CF73FCD5D67AE5FAC2FBA0BAAB8F", decimals: 8, logo: "https://assets.coingecko.com/coins/images/7598/large/wrapped_bitcoin_wbtc.png", priceId: "wrapped-bitcoin" },
      { symbol: "WETH", name: "Wrapped Ether", address: "0x7CEB23FD6BC0ADD59E62AC25578270CFF1B9F619", decimals: 18, logo: "https://assets.coingecko.com/coins/images/2518/large/weth.png", priceId: "weth" },
      { symbol: "DAI", name: "Dai", address: "0x8F3CF7AD23CD3CADB9735FD580221AE39A6E51C", decimals: 18, logo: "https://assets.coingecko.com/coins/images/9956/large/4943.png", priceId: "dai" },
      { symbol: "LINK", name: "Chainlink", address: "0x53E0BCA35EC356BD5FD4DEACD5AB448FCDA4DBB9", decimals: 18, logo: "https://assets.coingecko.com/coins/images/877/large/chainlink-new-logo.png", priceId: "chainlink" },
      { symbol: "AAVE", name: "Aave", address: "0xD6DF932A45C0F255F85145C42F15749F78FC54A5", decimals: 18, logo: "https://assets.coingecko.com/coins/images/12645/large/AAVE.png", priceId: "aave" },
      { symbol: "UNI", name: "Uniswap", address: "0xB33EAAD8D148D1E82F5D7E1A37CEC2BCC357C91D", decimals: 18, logo: "https://assets.coingecko.com/coins/images/12504/large/uniswap-uni.png", priceId: "uniswap" },
      { symbol: "RENDER", name: "Render", address: "0x28A2A4BBC00808B868EB31A89C7D8129B78484AD", decimals: 18, logo: "https://assets.coingecko.com/coins/images/11636/large/rndr.png", priceId: "render-token" }
    ],
  },
  bsc: {
    chainId: 56,
    name: "BNB Smart Chain",
    rpcUrl: process.env.BSC_RPC_URL,
    nativeCurrency: { name: "BNB", symbol: "BNB", decimals: 18 },
    tokens: [
      { symbol: "BNB", name: "BNB", decimals: 18, logo: "https://assets.coingecko.com/coins/images/825/large/binance-coin-logo.png", priceId: "binancecoin" },
      { symbol: "USDC", name: "USD Coin", address: "0x8AC76A51CC950D9822D68B83FEA1AD7B0D9E7BA2", decimals: 18, logo: "https://assets.coingecko.com/coins/images/6319/large/USD_Coin_icon.png", priceId: "usd-coin" },
      { symbol: "USDT", name: "Tether", address: "0x55D398326F99059FF775485246999027B3197955", decimals: 18, logo: "https://assets.coingecko.com/coins/images/325/large/Tether.png", priceId: "tether" },
      { symbol: "WETH", name: "Wrapped Ether", address: "0x2170ED0880AC9A755FD29B268895FBFF2FB23A78", decimals: 18, logo: "https://assets.coingecko.com/coins/images/2518/large/weth.png", priceId: "weth" },
      { symbol: "CAKE", name: "PancakeSwap", address: "0x0E09FABB73BD3ADE0A17ECC321FD13A19E81CE82", decimals: 18, logo: "https://assets.coingecko.com/coins/images/12632/large/pancakeswap-cake-logo.png", priceId: "pancakeswap-token" },
      { symbol: "DOGE", name: "Dogecoin", address: "0xBA2AE424D960C26247DD6C32EDC70B295C744C43", decimals: 18, logo: "https://assets.coingecko.com/coins/images/5/large/dogecoin.png", priceId: "dogecoin" },
      { symbol: "SHIB", name: "Shiba Inu", address: "0x2859E4544C526B0E65FBC1E5FD2F0B3D2F9F0CF4", decimals: 18, logo: "https://assets.coingecko.com/coins/images/11939/large/shiba.png", priceId: "shiba-inu" },
      { symbol: "LINK", name: "Chainlink", address: "0xF8A0BF9CF54FCD9D267935EBC6FBE75C4DCD6F0A", decimals: 18, logo: "https://assets.coingecko.com/coins/images/877/large/chainlink-new-logo.png", priceId: "chainlink" },
      { symbol: "UNI", name: "Uniswap", address: "0xBF5140A227752FE610F6BF6DCBD0759F08FD5CAB", decimals: 18, logo: "https://assets.coingecko.com/coins/images/12504/large/uniswap-uni.png", priceId: "uniswap" },
      { symbol: "FLOKI", name: "Floki", address: "0xFB5B838B6FAEC6DBEF2D6962DFFCE49A3B876ABB", decimals: 18, logo: "https://assets.coingecko.com/coins/images/16746/large/Floki.png", priceId: "floki" }
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