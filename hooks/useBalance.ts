import { useState, useEffect, useCallback } from 'react';
import { getTokenList } from '../lib/chain';
import toast from 'react-hot-toast';

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

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch balances');
      }

      // Show warnings for any token errors
      if (data.errors?.length > 0) {
        data.errors.forEach((err: { symbol: string; error: string }) => {
          console.warn(`Error fetching ${err.symbol} balance:`, err.error);
          if (err.error.includes('Token not supported')) {
            toast.error(`Token ${err.symbol} not supported on ${chain}`);
          }
        });
      }
      
      // Normalize balances to lowercase for case-insensitive lookup
      const normalizedBalances: Record<string, string> = {};
      data.balances.forEach((token: any) => {
        normalizedBalances[token.symbol.toLowerCase()] = token.balance;
      });

      setBalances(normalizedBalances);
    } catch (err: any) {
      console.error('Error fetching balances:', err);
      setError(err.message || 'Failed to fetch balances');
      toast.error(err.message || 'Failed to fetch balances');
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