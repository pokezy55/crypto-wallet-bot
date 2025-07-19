import { useState, useEffect, useCallback } from 'react';
import { getTokenListStatic } from '../lib/chain';

export interface TokenBalance {
  symbol: string;
  balance: string;
  decimals: number;
  address: string;
  isNative: boolean;
}

export function useBalance(address: string, chain: string) {
  const [tokens, setTokens] = useState<TokenBalance[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    if (!address || !chain) return;
    setLoading(true);
    setError(null);
    try {
      // Ambil daftar token default dari chain (static, tanpa env)
      const tokenList = getTokenListStatic(chain);
      console.log('tokenListStatic', chain, tokenList);
      // Fetch balance dari backend
      const res = await fetch('/api/balance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address, chain }),
      });
      const data = await res.json();
      // Gabungkan hasil API (array) ke tokenList
      const result: TokenBalance[] = data.balances.map((token: any) => ({
        symbol: token.symbol,
        balance: token.balance,
        decimals: token.decimals,
        address: token.address,
        isNative: token.isNative,
      }));
      console.log('tokenList with balances', result);
      setTokens(result);
    } catch (e: any) {
      setError(e.message || 'Failed to fetch balances');
      setTokens([]);
    } finally {
      setLoading(false);
    }
  }, [address, chain]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { tokens, loading, error, refetch };
} 