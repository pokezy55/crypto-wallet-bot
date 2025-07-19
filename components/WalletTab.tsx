'use client'

import React from 'react';
import { Globe } from 'lucide-react';
import TokenRow from './TokenRow';
import { CHAINS } from '@/lib/chain';

interface Chain {
  chainId: number;
  name: string;
  rpcUrl: () => string;
  native: {
    symbol: string;
    name: string;
    logo: string;
  };
  logo?: string;
  tokens: Token[];
}

interface Token {
  symbol: string;
  name: string;
  address: string;
  decimals: number;
  isNative: boolean;
  logo: string;
}

interface TokenWithBalance extends Token {
  balance: number;
  priceUSD: number;
  priceChange24h: number;
  chains: string[];
  isMerged: boolean;
}

interface WalletTabProps {
  chain: string;
  wallet: {
    id: string;
    address: string;
    balance?: Record<string, Record<string, string>>;
    seedPhrase?: string;
    createdAt?: string;
    updatedAt?: string;
  } | null;
  tokenPrices: TokenPrices;
  onSend: () => void;
  onReceive: () => void;
  onSwap: () => void;
  onAdd: () => void;
}

interface TokenPrices {
  [symbol: string]: {
    priceUSD: number;
    priceChange24h: number;
  };
}

export default function WalletTab({
  chain,
  wallet,
  tokenPrices,
  onSend,
  onReceive,
  onSwap,
  onAdd
}: WalletTabProps) {
  // Ambil balances dari wallet jika ada
  const walletBalances = (wallet && wallet.balance) || {};
  // Pilih balances sesuai chain aktif
  const activeBalances = walletBalances[chain] || {};

  // Get token list based on selected chain
  let tokenList: TokenWithBalance[] = [];
  
  if (chain === 'all') {
    // Kumpulkan semua token dari semua chain
    const allTokens: Record<string, TokenWithBalance> = {};
    Object.keys(CHAINS).forEach(chainId => {
      const chainConfig = CHAINS[chainId as keyof typeof CHAINS];
      const chainTokens = chainConfig.tokens || [];
      
      chainTokens.forEach((token) => {
        const balance = walletBalances[chainId]?.[token.symbol.toLowerCase()] || 
                       walletBalances[chainId]?.[token.symbol] || '0';
        const price = tokenPrices[token.symbol] || { priceUSD: 0, priceChange24h: 0 };
        
        if (['USDT', 'USDC'].includes(token.symbol)) {
          // Merge stablecoins
          if (!allTokens[token.symbol]) {
            allTokens[token.symbol] = {
              ...token,
              balance: 0,
              priceUSD: price.priceUSD,
              priceChange24h: price.priceChange24h,
              chains: [],
              isMerged: true
            };
          }
          const tokenBalance = parseFloat(balance);
          allTokens[token.symbol].balance += tokenBalance;
          if (tokenBalance > 0) {
            allTokens[token.symbol].chains.push(chainId.toUpperCase());
          }
        } else {
          // Non-stablecoin tokens
          const key = `${token.symbol}-${chainId}`;
          allTokens[key] = {
            ...token,
            balance: parseFloat(balance),
            priceUSD: price.priceUSD,
            priceChange24h: price.priceChange24h,
            chains: [chainId.toUpperCase()],
            isMerged: false
          };
        }
      });
    });

    tokenList = Object.values(allTokens);
  } else {
    // Chain spesifik
    const chainConfig = CHAINS[chain as keyof typeof CHAINS];
    if (!chainConfig) {
      throw new Error(`Invalid chain: ${chain}`);
    }

    tokenList = chainConfig.tokens.map(token => {
      const balance = activeBalances[token.symbol.toLowerCase()] || 
                     activeBalances[token.symbol] || '0';
      const price = tokenPrices[token.symbol] || { priceUSD: 0, priceChange24h: 0 };
      
      return {
        ...token,
        balance: parseFloat(balance),
        priceUSD: price.priceUSD,
        priceChange24h: price.priceChange24h,
        chains: [chain.toUpperCase()],
        isMerged: false
      };
    });
  }

  // Sort token list
  tokenList = tokenList.sort((a, b) => {
    const aValue = a.balance * (a.priceUSD || 0);
    const bValue = b.balance * (b.priceUSD || 0);
    return bValue - aValue;
  });

  // Calculate total portfolio value
  const totalValue = tokenList.reduce((sum, token) => {
    return sum + (token.balance * (token.priceUSD || 0));
  }, 0);

  return (
    <div className="flex-1 flex flex-col">
      <div className="p-4 border-b border-crypto-border">
        <div className="text-sm text-gray-400 mb-1">Total Portfolio Value</div>
        <div className="text-2xl font-bold">
          ${totalValue.toFixed(2)}
        </div>
        <div className="flex gap-2 mt-4">
          <button onClick={onSend} className="flex-1 bg-primary-500 text-white rounded-lg py-2 text-center">
            Send
          </button>
          <button onClick={onReceive} className="flex-1 bg-primary-500 text-white rounded-lg py-2 text-center">
            Receive
          </button>
          <button onClick={onSwap} className="flex-1 bg-primary-500 text-white rounded-lg py-2 text-center">
            Swap
          </button>
          <button onClick={onAdd} className="flex-1 bg-primary-500 text-white rounded-lg py-2 text-center">
            Add
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-auto space-y-2 p-4">
        {tokenList.map((token) => (
          <TokenRow
            key={token.isMerged ? `${token.symbol}-merged` : `${token.symbol}-${token.chains[0]}`}
            symbol={token.symbol}
            name={token.name}
            logo={token.logo}
            balance={token.balance}
            priceUSD={token.priceUSD}
            priceChange24h={token.priceChange24h}
            chains={token.chains}
            isMerged={token.isMerged}
          />
        ))}
      </div>
    </div>
  );
} 