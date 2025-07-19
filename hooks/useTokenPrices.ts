import { useState, useEffect } from 'react';

interface TokenPrice {
  priceUSD: number;
  priceChange24h: number;
}

export function useTokenPrices() {
  const [prices, setPrices] = useState<Record<string, TokenPrice>>({});

  const fetchPrices = async () => {
    try {
      const response = await fetch('/api/price');
      if (!response.ok) {
        throw new Error('Failed to fetch prices');
      }
      const data = await response.json();
      setPrices(data);
    } catch (error) {
      console.error('Error fetching prices:', error);
    }
  };

  useEffect(() => {
    // Initial fetch
    fetchPrices();

    // Set up polling every 60 seconds
    const interval = setInterval(fetchPrices, 60000);

    // Cleanup interval on unmount
    return () => clearInterval(interval);
  }, []);

  return prices;
} 