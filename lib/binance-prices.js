// Alternative crypto price fetching using Binance API

const BINANCE_BASE_URL = 'https://api.binance.com/api/v3';

// Mapping token symbols to Binance symbols
const BINANCE_SYMBOLS = {
  'ETH': 'ETHUSDT',
  'USDT': 'USDTUSDC', // Using USDC pair for USDT
  'BNB': 'BNBUSDT',
  'POL': 'MATICUSDT', // Polygon is MATIC on Binance
  'BASE': 'ETHUSDT' // Base uses ETH price
};

export async function fetchBinancePrices(symbols = ['ETH', 'USDT', 'BNB', 'POL']) {
  try {
    const pricePromises = symbols.map(async (symbol) => {
      const binanceSymbol = BINANCE_SYMBOLS[symbol];
      if (!binanceSymbol) return null;

      const response = await fetch(`${BINANCE_BASE_URL}/ticker/24hr?symbol=${binanceSymbol}`);
      if (!response.ok) return null;

      const data = await response.json();
      return {
        symbol,
        price: parseFloat(data.lastPrice),
        change24h: parseFloat(data.priceChangePercent),
        volume: parseFloat(data.volume),
        high24h: parseFloat(data.highPrice),
        low24h: parseFloat(data.lowPrice)
      };
    });

    const results = await Promise.all(pricePromises);
    const prices = {};

    results.forEach(result => {
      if (result) {
        prices[result.symbol] = {
          price: result.price,
          change24h: result.change24h,
          volume: result.volume,
          high24h: result.high24h,
          low24h: result.low24h,
          lastUpdated: Date.now()
        };
      }
    });

    return prices;
  } catch (error) {
    console.error('Error fetching Binance prices:', error);
    return {};
  }
}

// WebSocket connection for real-time prices (optional)
export function createBinanceWebSocket(symbols = ['ETHUSDT', 'BNBUSDT', 'MATICUSDT'], onUpdate) {
  const ws = new WebSocket('wss://stream.binance.com:9443/ws/!ticker@arr');
  
  ws.onopen = () => {
    console.log('Binance WebSocket connected');
  };
  
  ws.onmessage = (event) => {
    const data = JSON.parse(event.data);
    const filteredData = data.filter(item => 
      symbols.includes(item.s)
    );
    
    if (onUpdate) {
      onUpdate(filteredData);
    }
  };
  
  ws.onerror = (error) => {
    console.error('Binance WebSocket error:', error);
  };
  
  return ws;
} 