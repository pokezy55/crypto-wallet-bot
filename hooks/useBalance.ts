import { useState, useEffect, useCallback } from 'react';
import { CHAINS } from '../lib/chain';

export interface TokenBalance {
  symbol: string;
  name: string;
  balance: string;
  address: string;
  decimals: number;
  isNative: boolean;
  logo: string;
}

export function useBalance(address: string, chain: string) {
  const [tokens, setTokens] = useState<TokenBalance[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchBalance = useCallback(async () => {
    if (!address || !chain) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/balance?address=${address}&chain=${chain}`);
      if (!response.ok) {
        throw new Error('Failed to fetch balance');
      }

      const data = await response.json();
      const chainConfig = CHAINS[chain as keyof typeof CHAINS];
      
      if (!chainConfig) {
        throw new Error(`Chain ${chain} not found`);
      }

      // Map balances to token list
      const tokenBalances = chainConfig.tokens.map(token => ({
        ...token,
        balance: data.balances[token.symbol.toLowerCase()] || 
                data.balances[token.symbol] || 
                '0'
      }));

      setTokens(tokenBalances);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [address, chain]);

  useEffect(() => {
    fetchBalance();
  }, [fetchBalance]);

  return {
    tokens,
    loading,
    error,
    refetch: fetchBalance
  };
} 