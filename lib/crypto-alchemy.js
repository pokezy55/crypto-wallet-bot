const ALCHEMY_API_KEY = process.env.ALCHEMY_API_KEY || 'ZmMF5QF7DT6jMGP3sps6a';

const ALCHEMY_BASE_URLS = {
  eth: `https://eth-mainnet.g.alchemy.com/v2/`,
  polygon: `https://polygon-mainnet.g.alchemy.com/v2/`,
  bsc: `https://bsc-mainnet.g.alchemy.com/v2/`,
  base: `https://base-mainnet.g.alchemy.com/v2/`,
}

function getAlchemyUrl(chain) {
  const key = (chain || 'eth').toLowerCase();
  return (ALCHEMY_BASE_URLS[key] || ALCHEMY_BASE_URLS.eth) + ALCHEMY_API_KEY;
}

// WARNING: Jangan gunakan file ini untuk BSC! Untuk BSC, gunakan ethers.js public RPC, bukan Alchemy.

export async function fetchEthBalance(address, chain = 'eth') {
  if (chain === 'bsc') {
    throw new Error('[Alchemy] fetchEthBalance: BSC tidak didukung oleh Alchemy. Gunakan ethers.js public RPC!');
  }
  const url = getAlchemyUrl(chain);
  console.log('[Alchemy] fetchEthBalance - URL:', url, 'Address:', address, 'Chain:', chain);
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'eth_getBalance',
        params: [address, 'latest']
      })
    })
    if (!res.ok) {
      const errText = await res.text();
      console.error('[Alchemy] fetchEthBalance error', chain, errText)
      return 0
    }
    const data = await res.json()
    if (data.error) {
      console.error('[Alchemy] fetchEthBalance error', chain, data.error)
      return 0
    }
    if (data.result) {
      return parseInt(data.result, 16) / 1e18
    }
    return 0
  } catch (err) {
    console.error('[Alchemy] fetchEthBalance FETCH FAILED', chain, err);
    return 0;
  }
}

import { ethers } from 'ethers';
let Alchemy;
try {
  // Optional: Only import if available
  Alchemy = require('alchemy-sdk').Alchemy;
} catch {}

// Helper to safely normalize address or fallback to original
function safeGetAddress(addr) {
  try {
    return ethers.getAddress(addr);
  } catch (e1) {
    try {
      return ethers.getAddress(addr.toLowerCase());
    } catch (e2) {
      console.warn('Invalid ERC20 address (checksum error, fallback to original):', addr, e1.message, e2.message);
      return addr; // fallback: use original address, let contract call handle error
    }
  }
}

// Example usage in balance fetch:
// if (token.address) {
//   const checksumAddress = safeGetAddress(token.address);
//   // Optionally verify contract exists
//   const code = await provider.getCode(checksumAddress);
//   if (!code || code === '0x') { console.warn('No contract at address:', checksumAddress); }
//   ...
// }

// In-memory cache for token metadata by (chain+symbol)
const tokenMetadataCache = {};

// Helper: Get Alchemy instance for a chain
function getAlchemyInstance(chain) {
  if (!Alchemy) throw new Error('alchemy-sdk not installed');
  const networkMap = {
    eth: 'eth-mainnet',
    polygon: 'polygon-mainnet',
    bsc: 'bsc-mainnet',
    base: 'base-mainnet',
  };
  return new Alchemy({
    apiKey: process.env.ALCHEMY_API_KEY,
    network: networkMap[chain] || 'eth-mainnet',
  });
}

// Helper: Fetch and cache ERC20 token metadata (address, decimals, name, symbol, logo)
export async function getTokenMetadata(symbol, chain = 'eth') {
  const cacheKey = `${chain}:${symbol.toUpperCase()}`;
  if (tokenMetadataCache[cacheKey]) return tokenMetadataCache[cacheKey];
  // Find token in TOKENS config (for logo, name, decimals)
  const tokenConfig = (TOKENS[chain] || []).find(t => t.symbol.toUpperCase() === symbol.toUpperCase());
  if (!tokenConfig) return null;
  // If native token, return config (address: null)
  if (!tokenConfig.address && tokenConfig.decimals && tokenConfig.symbol) {
    tokenMetadataCache[cacheKey] = { ...tokenConfig, address: null };
    return tokenMetadataCache[cacheKey];
  }
  // ERC20: Try to find address via Alchemy getTokenMetadata
  try {
    const alchemy = getAlchemyInstance(chain);
    // Try to find contract address by symbol (search top tokens)
    // NOTE: Alchemy does not provide symbol->address directly, so you may need to maintain a mapping or use a token list API.
    // For demo, fallback to config if present
    let address = tokenConfig.address;
    if (!address && alchemy.core && alchemy.core.getTokenMetadata) {
      // If you have a contract address, use getTokenMetadata(address)
      // If not, you need to resolve symbol to address (not always possible without a token list)
      // For now, fallback to config
    }
    if (address) {
      // Normalize address
      address = ethers.getAddress(address);
      // Fetch metadata from Alchemy (decimals, name, symbol, logo)
      let meta = {};
      if (alchemy.core && alchemy.core.getTokenMetadata) {
        try {
          meta = await alchemy.core.getTokenMetadata(address);
        } catch {}
      }
      const result = {
        ...tokenConfig,
        ...meta,
        address,
      };
      tokenMetadataCache[cacheKey] = result;
      return result;
    }
  } catch (e) {
    // Fallback: return config without address
    tokenMetadataCache[cacheKey] = { ...tokenConfig, address: null };
    return tokenMetadataCache[cacheKey];
  }
  // Fallback: return config without address
  tokenMetadataCache[cacheKey] = { ...tokenConfig, address: null };
  return tokenMetadataCache[cacheKey];
}

// Refactor TOKENS: remove all hardcoded address fields, only keep symbol, decimals, name, logo
export const TOKENS = {
  ethereum: [
    { symbol: 'ETH', name: 'Ethereum', decimals: 18, address: null, logo: 'https://assets.coingecko.com/coins/images/279/large/ethereum.png' },
    { symbol: 'USDT', name: 'Tether', decimals: 6, address: '0xdAC17F958D2ee523a2206206994597C13D831ec7', logo: 'https://assets.coingecko.com/coins/images/325/large/Tether.png' },
    { symbol: 'USDC', name: 'USD Coin', decimals: 6, address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', logo: 'https://assets.coingecko.com/coins/images/6319/large/USD_Coin_icon.png' },
    { symbol: 'DAI', name: 'Dai', decimals: 18, address: '0x6B175474E89094C44Da98b954EedeAC495271d0F', logo: 'https://assets.coingecko.com/coins/images/9956/large/4943.png' },
    { symbol: 'WBTC', name: 'Wrapped Bitcoin', decimals: 8, address: '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599', logo: 'https://assets.coingecko.com/coins/images/7598/large/wrapped_bitcoin_wbtc.png' },
    { symbol: 'LINK', name: 'Chainlink', decimals: 18, address: '0x514910771AF9Ca65E365357d1743Ef8fA8AacEfE', logo: 'https://assets.coingecko.com/coins/images/877/large/chainlink-new-logo.png' },
    { symbol: 'UNI', name: 'Uniswap', decimals: 18, address: '0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984', logo: 'https://assets.coingecko.com/coins/images/12504/large/uniswap-uni.png' },
    { symbol: 'AAVE', name: 'Aave', decimals: 18, address: '0x7Fc66500cEAb8Ccde615bF154d85B5B8DfB0eAA9', logo: 'https://assets.coingecko.com/coins/images/12645/large/AAVE.png' },
    { symbol: 'SHIB', name: 'Shiba Inu', decimals: 18, address: '0x95aD61b0a150d79219dCF64E1E6Cc01f0B64C4cE', logo: 'https://assets.coingecko.com/coins/images/11939/large/shiba.png' }
  ],
  bsc: [
    { symbol: 'BNB', name: 'BNB', decimals: 18, address: null, logo: 'https://assets.coingecko.com/coins/images/825/large/binance-coin-logo.png' },
    { symbol: 'USDT', name: 'Tether', decimals: 18, address: '0x55d398326f99059fF775485246999027B3197955', logo: 'https://assets.coingecko.com/coins/images/325/large/Tether.png' },
    { symbol: 'USDC', name: 'USD Coin', decimals: 18, address: '0x8AC76a51Cc950d9822D68b83FEa1Ad7b0d9E7bA2', logo: 'https://assets.coingecko.com/coins/images/6319/large/USD_Coin_icon.png' },
    { symbol: 'DOGE', name: 'Dogecoin', decimals: 18, address: '0xbA2ae424d960c26247Dd6c32edC70B295c744C43', logo: 'https://assets.coingecko.com/coins/images/5/large/dogecoin.png' },
    { symbol: 'SHIB', name: 'Shiba Inu', decimals: 18, address: '0x2859e4544C526B0E65fbc1e5FD2f0B3D2F9f0Cf4', logo: 'https://assets.coingecko.com/coins/images/11939/large/shiba.png' },
    { symbol: 'LINK', name: 'Chainlink', decimals: 18, address: '0xF8A0BF9Cf54Bb92F17374d9e9A321E6a111a51bD', logo: 'https://assets.coingecko.com/coins/images/877/large/chainlink-new-logo.png' },
    { symbol: 'UNI', name: 'Uniswap', decimals: 18, address: '0xbf5140A22578168FD562DCcF235E5D43A02ce9B1', logo: 'https://assets.coingecko.com/coins/images/12504/large/uniswap-uni.png' },
    { symbol: 'CAKE', name: 'PancakeSwap', decimals: 18, address: '0x0E09FaBB73Bd3Ade0a17ECC321fD13a19e81cE82', logo: 'https://assets.coingecko.com/coins/images/12632/large/pancakeswap-cake-logo.png' }
  ],
  polygon: [
    { symbol: 'MATIC', name: 'Polygon', decimals: 18, address: null, logo: 'https://assets.coingecko.com/coins/images/4713/large/matic-token-icon.png' },
    { symbol: 'USDT', name: 'Tether', decimals: 6, address: '0xc2132D05D31c914a87C66119CFAf01602Fad7D2e', logo: 'https://assets.coingecko.com/coins/images/325/large/Tether.png' },
    { symbol: 'USDC', name: 'USD Coin', decimals: 6, address: '0x2791Bca1f2de4661ED88A30C99A7a9214Ef89a3B', logo: 'https://assets.coingecko.com/coins/images/6319/large/USD_Coin_icon.png' },
    { symbol: 'DAI', name: 'Dai', decimals: 18, address: '0x8f3Cf7ad23Cd3CaDbD9735Fd580221Ae39a6E51c', logo: 'https://assets.coingecko.com/coins/images/9956/large/4943.png' },
    { symbol: 'LINK', name: 'Chainlink', decimals: 18, address: '0x53E0bca35eC356BD5FD4DeeD2dB93E6dA112aC4A', logo: 'https://assets.coingecko.com/coins/images/877/large/chainlink-new-logo.png' },
    { symbol: 'AAVE', name: 'Aave', decimals: 18, address: '0xD6DF932A45C0f255f85145c42f15749f78Fc54A5', logo: 'https://assets.coingecko.com/coins/images/12645/large/AAVE.png' },
    { symbol: 'WBTC', name: 'Wrapped Bitcoin', decimals: 8, address: '0x1BFD67037B42Cf73cE6411eE56EeDe8e1A5e6E52', logo: 'https://assets.coingecko.com/coins/images/7598/large/wrapped_bitcoin_wbtc.png' }
  ],
  base: [
    { symbol: 'ETH', name: 'Ethereum', decimals: 18, address: null, logo: 'https://assets.coingecko.com/coins/images/279/large/ethereum.png' },
    { symbol: 'USDC', name: 'USD Coin', decimals: 6, address: '0x833589fCD6eDb6E08f4c7C3ED9EbF0bF733aBfF4', logo: 'https://assets.coingecko.com/coins/images/6319/large/USD_Coin_icon.png' },
    { symbol: 'DAI', name: 'Dai', decimals: 18, address: '0x50c5725949A6F0c72E6C4a641aCc2eAa7c1cF5c3', logo: 'https://assets.coingecko.com/coins/images/9956/large/4943.png' },
    { symbol: 'AERO', name: 'Aerodrome Finance', decimals: 18, address: '0x940181a94A35A4569E4529A3CDfB74e38Fd98631', logo: 'https://assets.coingecko.com/coins/images/30981/large/aero.png' },
    { symbol: 'BRETT', name: 'Brett', decimals: 18, address: '0x532F27101965DDfA0F7F6f4EB288FDbC93D1999D', logo: 'https://assets.coingecko.com/coins/images/30996/large/brett.png' },
    { symbol: 'TOSHI', name: 'Toshi', decimals: 18, address: '0x34D21BfD9E365D06540307040D6E7C064E43A9A7', logo: 'https://assets.coingecko.com/coins/images/30994/large/toshi.png' }
  ]
};

export function getTokenInfo(symbol, chain = 'eth') {
  const tokens = TOKENS[chain] || [];
  return tokens.find(t => t.symbol.toUpperCase() === symbol.toUpperCase());
}

export async function fetchErc20Balance(address, symbol, chain = 'eth') {
  if (chain === 'bsc') {
    throw new Error('[Alchemy] fetchErc20Balance: BSC tidak didukung oleh Alchemy. Gunakan ethers.js public RPC!');
  }
  const token = getTokenInfo(symbol, chain);
  if (!token || !token.address) return 0;
  const contract = token.address;
  const decimals = token.decimals;
  const url = getAlchemyUrl(chain);
  const data = '0x70a08231000000000000000000000000' + address.replace('0x', '');
  console.log('[Alchemy] fetchErc20Balance - URL:', url, 'Address:', address, 'Symbol:', symbol, 'Chain:', chain, 'Contract:', contract);
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'eth_call',
        params: [
          {
            to: contract,
            data
          },
          'latest'
        ]
      })
    })
    if (!res.ok) {
      const errText = await res.text();
      console.error('[Alchemy] fetchErc20Balance error', chain, errText)
      return 0
    }
    const result = await res.json()
    if (result.error) {
      console.error('[Alchemy] fetchErc20Balance error', chain, result.error)
      return 0
    }
    // Validasi hex string sebelum parsing
    if (result.result && /^0x[0-9a-fA-F]+$/.test(result.result)) {
      return parseInt(result.result, 16) / 10 ** decimals
    }
    // Jika tidak valid, return 0
    return 0
  } catch (err) {
    console.error('[Alchemy] fetchErc20Balance FETCH FAILED', chain, err);
    return 0;
  }
}

// Fungsi untuk fetch transaction history (Alchemy Transfers API v2)
export async function fetchTransactionHistory(address, chain = 'eth') {
  const url = getAlchemyUrl(chain);
  console.log('[Alchemy] fetchTransactionHistory - URL:', url, 'Address:', address, 'Chain:', chain);
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: 1,
        jsonrpc: '2.0',
        method: 'alchemy_getAssetTransfers',
        params: [{
          fromBlock: '0x0',
          toBlock: 'latest',
          toAddress: address,
          category: ['external', 'erc20', 'erc721', 'erc1155', 'internal', 'token'],
          withMetadata: true,
          excludeZeroValue: true,
          maxCount: '0x32'
        }]
      })
    });
    if (!res.ok) {
      const errText = await res.text();
      console.error('[Alchemy] fetchTransactionHistory error', chain, errText)
      return []
    }
    const data = await res.json();
    if (data.error) {
      console.error('[Alchemy] fetchTransactionHistory error', chain, data.error)
      return []
    }
    return data.result?.transfers || [];
  } catch (err) {
    console.error('[Alchemy] fetchTransactionHistory FETCH FAILED', chain, err);
    return [];
  }
}

// CoinGecko id mapping for native tokens
const COINGECKO_NATIVE_IDS = {
  eth: 'ethereum',
  polygon: 'matic-network',
  bsc: 'binancecoin',
  base: 'ethereum', // base ETH uses ethereum price
};

// CoinGecko id mapping for ERC20 by contract address (lowercase)
const COINGECKO_CONTRACT_IDS = {
  // Example: '0xdac17f958d2ee523a2206206994597c13d831ec7': 'tether',
  // Fill as needed or fetch from CoinGecko API if dynamic
};

export async function fetchWalletTokensWithPrices(address, chain = 'eth', providerUrl = null) {
  const tokens = TOKENS[chain] || [];
  let provider;
  if (providerUrl) {
    provider = new ethers.JsonRpcProvider(providerUrl);
  } else if (chain === 'bsc') {
    provider = new ethers.JsonRpcProvider('https://bsc-dataseed.binance.org/');
  } else if (chain === 'polygon') {
    provider = new ethers.JsonRpcProvider('https://polygon-rpc.com/');
  } else if (chain === 'base') {
    provider = new ethers.JsonRpcProvider('https://mainnet.base.org');
  } else {
    provider = new ethers.JsonRpcProvider('https://eth.llamarpc.com');
  }

  // 1. Fetch all balances (always return string, even on error)
  const balances = await Promise.all(tokens.map(async (token) => {
    try {
      if (!token.address) {
        const bal = await provider.getBalance(address);
        return ethers.formatUnits(bal, token.decimals);
      } else {
        const checksumAddress = safeGetAddress(token.address);
        if (!checksumAddress) return '0.0'; // Skip invalid token
        // Optionally verify contract exists
        const code = await provider.getCode(checksumAddress);
        if (!code || code === '0x') { console.warn('No contract at address:', checksumAddress); return '0.0'; }
        const contract = new ethers.Contract(checksumAddress, ["function balanceOf(address) view returns (uint256)"], provider);
        const bal = await contract.balanceOf(address);
        return ethers.formatUnits(bal, token.decimals);
      }
    } catch (e) {
      return '0.0';
    }
  }));

  // 2. Build CoinGecko price query
  const nativeToken = tokens.find(t => !t.address);
  const ids = [];
  const contractMap = {};
  for (const token of tokens) {
    if (!token.address) {
      const id = COINGECKO_NATIVE_IDS[chain];
      if (id && !ids.includes(id)) ids.push(id);
    } else {
      contractMap[token.address.toLowerCase()] = token.symbol;
    }
  }
  const contractAddrs = Object.keys(contractMap);

  // 3. Fetch prices from CoinGecko
  let priceData = {};
  try {
    let url = 'https://api.coingecko.com/api/v3/simple/token_price/' +
      (chain === 'polygon' ? 'polygon-pos' : chain === 'bsc' ? 'binance-smart-chain' : chain === 'base' ? 'base' : 'ethereum') +
      '?contract_addresses=' + contractAddrs.join(',') + '&vs_currencies=usd&include_24hr_change=true';
    if (ids.length > 0) {
      url += '&ids=' + ids.join(',') + '&vs_currencies=usd&include_24hr_change=true';
    }
    const res = await fetch(url);
    if (res.ok) {
      priceData = await res.json();
    }
  } catch (e) {
    priceData = {};
  }

  // 4. Map prices to tokens (always return all fields)
  const result = tokens.map((token, i) => {
    let priceUSD = 0, priceChange24h = 0;
    if (!token.address) {
      const id = COINGECKO_NATIVE_IDS[chain];
      if (id && priceData[id]) {
        priceUSD = priceData[id].usd || 0;
        priceChange24h = priceData[id].usd_24h_change || 0;
      }
    } else {
      const priceObj = priceData[token.address.toLowerCase()];
      if (priceObj) {
        priceUSD = priceObj.usd || 0;
        priceChange24h = priceObj.usd_24h_change || 0;
      }
    }
    return {
      symbol: token.symbol,
      name: token.name,
      logo: token.logo,
      balance: typeof balances[i] === 'string' ? balances[i] : '0.0',
      priceUSD,
      priceChange24h
    };
  });
  return result;
} 