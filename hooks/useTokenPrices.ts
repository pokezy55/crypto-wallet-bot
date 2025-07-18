import { useState, useEffect, useRef } from 'react';

const COINGECKO_URL = 'https://api.coingecko.com/api/v3/simple/price?ids=ethereum,tether,usd-coin,binancecoin,matic-network&vs_currencies=usd&include_24hr_change=true';
const TOKEN_ID_MAP: Record<string, string> = {
  ETH: 'ethereum',
  USDT: 'tether',
  USDC: 'usd-coin',
  BNB: 'binancecoin',
  MATIC: 'matic-network',
  BASE: 'ethereum', // gunakan harga ETH untuk Base ETH
};

export interface TokenPriceInfo {
  priceUSD: number;
  priceChange24h: number;
}

export function useTokenPrices() {
  const [prices, setPrices] = useState<Record<string, TokenPriceInfo>>({});
  const lastFetchRef = useRef<number>(0);

  useEffect(() => {
    const fetchPrices = async () => {
      const now = Date.now();
      if (now - lastFetchRef.current < 60000 && Object.keys(prices).length > 0) {
        // Cache 60 detik
        return;
      }
      try {
        const res = await fetch(COINGECKO_URL);
        const data = await res.json();
        const mapped: Record<string, TokenPriceInfo> = {};
        Object.entries(TOKEN_ID_MAP).forEach(([symbol, id]) => {
          if (data[id]) {
            mapped[symbol] = {
              priceUSD: data[id].usd ?? 0,
              priceChange24h: data[id].usd_24h_change ?? 0,
            };
          } else {
            mapped[symbol] = { priceUSD: 0, priceChange24h: 0 };
          }
        });
        setPrices(mapped);
        lastFetchRef.current = now;
      } catch (e) {
        // Jika error, set semua harga 0
        const fallback: Record<string, TokenPriceInfo> = {};
        Object.keys(TOKEN_ID_MAP).forEach(symbol => {
          fallback[symbol] = { priceUSD: 0, priceChange24h: 0 };
        });
        setPrices(fallback);
      }
    };
    fetchPrices();
    const interval = setInterval(fetchPrices, 60000);
    return () => clearInterval(interval);
  }, []);

  return prices;
} 