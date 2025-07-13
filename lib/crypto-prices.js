// Crypto price fetching utility using CoinGecko API

const COINGECKO_BASE_URL = 'https://api.coingecko.com/api/v3';

// Mapping token symbols to CoinGecko IDs
const TOKEN_IDS = {
  'ETH': 'ethereum',
  'USDT': 'tether',
  'BNB': 'binancecoin',
  'POL': 'matic-network',
  'BASE': 'ethereum' // Base uses ETH price
};

export async function fetchTokenPrices(symbols = ['ETH', 'USDT', 'BNB', 'POL']) {
  try {
    const ids = symbols.map(symbol => TOKEN_IDS[symbol]).filter(Boolean);
    const response = await fetch(
      `${COINGECKO_BASE_URL}/simple/price?ids=${ids.join(',')}&vs_currencies=usd&include_24hr_change=true&include_last_updated_at=true`
    );
    
    if (!response.ok) {
      throw new Error('Failed to fetch prices');
    }
    
    const data = await response.json();
    
    // Transform data to match our token format
    const prices = {};
    symbols.forEach(symbol => {
      const id = TOKEN_IDS[symbol];
      if (data[id]) {
        prices[symbol] = {
          price: data[id].usd,
          change24h: data[id].usd_24h_change,
          lastUpdated: data[id].last_updated_at
        };
      }
    });
    
    return prices;
  } catch (error) {
    console.error('Error fetching token prices:', error);
    // Return fallback prices if API fails
    return {
      ETH: { price: 1850.45, change24h: 2.15, lastUpdated: Date.now() },
      USDT: { price: 1.001, change24h: 0.05, lastUpdated: Date.now() },
      BNB: { price: 245.67, change24h: -1.23, lastUpdated: Date.now() },
      POL: { price: 0.234, change24h: -2.67, lastUpdated: Date.now() }
    };
  }
}

// Fetch single token price
export async function fetchSingleTokenPrice(symbol) {
  const prices = await fetchTokenPrices([symbol]);
  return prices[symbol];
}

// Get cached prices (for performance)
let cachedPrices = null;
let lastFetchTime = 0;
const CACHE_DURATION = 30000; // 30 seconds

export async function getCachedTokenPrices() {
  const now = Date.now();
  
  if (!cachedPrices || (now - lastFetchTime) > CACHE_DURATION) {
    cachedPrices = await fetchTokenPrices();
    lastFetchTime = now;
  }
  
  return cachedPrices;
} 