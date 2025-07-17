import { useState, useEffect, useCallback } from 'react';

export interface BalanceResponse {
  balances: Record<string, string>;
  chain: string;
  error?: string;
}

export interface TokenBalance {
  symbol: string;
  amount: number;
}

export function useBalance(address: string, chain: string) {
  const [balances, setBalances] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    if (!address || !chain) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/balance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address, chain }),
      });
      const data: BalanceResponse = await res.json();
      if (data.error) setError(data.error);
      else setBalances(data.balances);
    } catch (e: any) {
      setError(e.message || 'Failed to fetch balances');
    } finally {
      setLoading(false);
    }
  }, [address, chain]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { balances, loading, error, refetch };
} 