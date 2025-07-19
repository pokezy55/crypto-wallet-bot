import { useState, useEffect, useCallback } from 'react';
import { getTokenList } from '../lib/chain';

export interface TokenBalance {
  symbol: string;
  balance: string;
}

interface Token {
  symbol: string;
  name: string;
  logo?: string;
  address?: string;
  decimals: number;
  isNative?: boolean;
}

export function useBalance(chain: string, address?: string) {
  const [balances, setBalances] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchBalances = useCallback(async () => {
    if (!address) {
      setBalances({});
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/balance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          address,
          chain
        })
      });

      if (!response.ok) {
        throw new Error('Failed to fetch balances');
      }

      const data = await response.json();
      
      // Normalize balances to lowercase for case-insensitive lookup
      const normalizedBalances: Record<string, string> = {};
      data.balances.forEach((token: any) => {
        normalizedBalances[token.symbol.toLowerCase()] = token.balance;
      });

      setBalances(normalizedBalances);
    } catch (err: any) {
      console.error('Error fetching balances:', err);
      setError(err.message || 'Failed to fetch balances');
      setBalances({});
    } finally {
      setLoading(false);
    }
  }, [chain, address]);

  useEffect(() => {
    fetchBalances();
  }, [fetchBalances]);

  // Get token list for the chain
  const tokens = getTokenList(chain);
  
  // Map balances to token list
  const tokenBalances = tokens.map((token: Token) => ({
    symbol: token.symbol,
    balance: balances[token.symbol.toLowerCase()] || '0'
  }));

  return {
    balances: tokenBalances,
    loading,
    error,
    refetch: fetchBalances
  };
} 