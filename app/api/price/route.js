import { getTokenList } from '../../../lib/chain';

const COINGECKO_NATIVE_IDS = {
  eth: 'ethereum',
  polygon: 'matic-network',
  bsc: 'binancecoin',
  base: 'ethereum', // base ETH uses ethereum price
};
const COINGECKO_CHAIN_ID = {
  eth: 'ethereum',
  polygon: 'polygon-pos',
  bsc: 'binance-smart-chain',
  base: 'base',
};
const priceCache = {};
const CACHE_TTL = 60 * 1000;

function getCacheKey(symbol, chain) {
  return `${symbol.toUpperCase()}_${chain}`;
}

export async function POST(request) {
  try {
    const { chain } = await request.json();
    if (!chain) return Response.json({ error: 'Missing chain' }, { status: 400 });
    const tokens = getTokenList(chain);
    const now = Date.now();
    const prices = {};
    const nativeTokens = tokens.filter(t => !t.address);
    const erc20Tokens = tokens.filter(t => t.address);
    const nativeId = COINGECKO_NATIVE_IDS[chain];
    const chainId = COINGECKO_CHAIN_ID[chain];
    // 1. Native prices (by priceId)
    for (const token of nativeTokens) {
      const cacheKey = getCacheKey(token.symbol, chain);
      if (priceCache[cacheKey] && (now - priceCache[cacheKey].ts < CACHE_TTL)) {
        prices[cacheKey] = priceCache[cacheKey].data;
        continue;
      }
      if (token.priceId) {
        try {
          const url = `https://api.coingecko.com/api/v3/simple/price?ids=${token.priceId}&vs_currencies=usd&include_24hr_change=true`;
          const res = await fetch(url);
          const data = await res.json();
          const priceUSD = data[token.priceId]?.usd || 0;
          const priceChange24h = data[token.priceId]?.usd_24h_change || 0;
          prices[cacheKey] = { priceUSD, priceChange24h };
          priceCache[cacheKey] = { data: prices[cacheKey], ts: now };
        } catch {
          prices[cacheKey] = { priceUSD: 0, priceChange24h: 0 };
        }
      } else {
        prices[cacheKey] = { priceUSD: 0, priceChange24h: 0 };
      }
    }
    // 2. ERC20 prices (by address)
    if (erc20Tokens.length > 0 && chainId) {
      // Always use lowercase for CoinGecko
      const addrList = erc20Tokens.map(t => t.address.toLowerCase()).join(',');
      try {
        const url = `https://api.coingecko.com/api/v3/simple/token_price/${chainId}?contract_addresses=${addrList}&vs_currencies=usd&include_24hr_change=true`;
        const res = await fetch(url);
        const data = await res.json();
        // Map result using lowercase address
        for (const token of erc20Tokens) {
          const cacheKey = getCacheKey(token.symbol, chain);
          if (priceCache[cacheKey] && (now - priceCache[cacheKey].ts < CACHE_TTL)) {
            prices[cacheKey] = priceCache[cacheKey].data;
            continue;
          }
          const priceObj = data[token.address.toLowerCase()];
          if (priceObj) {
            prices[cacheKey] = {
              priceUSD: priceObj.usd || 0,
              priceChange24h: priceObj.usd_24h_change || 0
            };
            priceCache[cacheKey] = { data: prices[cacheKey], ts: now };
          } else {
            prices[cacheKey] = { priceUSD: 0, priceChange24h: 0 };
          }
        }
      } catch {
        for (const token of erc20Tokens) {
          const cacheKey = getCacheKey(token.symbol, chain);
          prices[cacheKey] = { priceUSD: 0, priceChange24h: 0 };
        }
      }
    }
    return Response.json(prices);
  } catch (error) {
    console.error('Price fetch error:', error);
    return Response.json({ error: 'Internal server error', message: error.message }, { status: 500 });
  }
} 