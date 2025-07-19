const COINGECKO_URL = 'https://api.coingecko.com/api/v3/simple/price?ids=ethereum,tether,usd-coin,binancecoin,matic-network&vs_currencies=usd&include_24hr_change=true';

const TOKEN_ID_MAP = {
  ETH: 'ethereum',
  USDT: 'tether',
  USDC: 'usd-coin',
  BNB: 'binancecoin',
  MATIC: 'matic-network',
  BASE: 'ethereum', // Use ETH price for Base ETH
};

export async function GET() {
  try {
    const response = await fetch(COINGECKO_URL);
    if (!response.ok) {
      throw new Error('Failed to fetch from CoinGecko');
    }

    const data = await response.json();
    const prices = {};

    // Map CoinGecko response to our format
    Object.entries(TOKEN_ID_MAP).forEach(([symbol, id]) => {
      if (data[id]) {
        prices[symbol] = {
          priceUSD: data[id].usd || 0,
          priceChange24h: data[id].usd_24h_change || 0
        };
      } else {
        prices[symbol] = {
          priceUSD: 0,
          priceChange24h: 0
        };
      }
    });

    return Response.json(prices);
  } catch (error) {
    console.error('Price fetch error:', error);
    
    // Return fallback prices (all 0) on error
    const fallbackPrices = {};
    Object.keys(TOKEN_ID_MAP).forEach(symbol => {
      fallbackPrices[symbol] = {
        priceUSD: 0,
        priceChange24h: 0
      };
    });

    return Response.json(fallbackPrices);
  }
} 