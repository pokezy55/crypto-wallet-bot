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
  isNative: boolean;
}

interface WalletBalances {
  [chain: string]: {
    [symbol: string]: string;
  };
}

interface TokenPrices {
  [symbol: string]: {
    priceUSD: number;
    priceChange24h: number;
  };
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
  const walletBalances: WalletBalances = (wallet && wallet.balance) || {};
  // Pilih balances sesuai chain aktif
  const activeBalances: Record<string, string> = walletBalances[chain] || {};

  // Fungsi helper untuk mengecek apakah token adalah native token
  const isNativeToken = (symbol: string, chainId: string): boolean => {
    const chainConfig = CHAINS[chainId as keyof typeof CHAINS];
    return chainConfig?.native?.symbol === symbol;
  };

  // Fungsi helper untuk mendapatkan native token info
  const getNativeTokenInfo = (chainId: string) => {
    const chainConfig = CHAINS[chainId as keyof typeof CHAINS];
    if (!chainConfig) {
      throw new Error(`Invalid chain ID: ${chainId}`);
    }
    return {
      symbol: chainConfig.native.symbol,
      name: chainConfig.native.name,
      logo: chainConfig.native.logo || chainConfig.logo || '',
      chainId
    };
  };

  // Fungsi untuk mengurutkan token
  const sortTokens = (tokens: TokenWithBalance[]): TokenWithBalance[] => {
    return tokens.sort((a, b) => {
      // Prioritaskan token dengan balance > 0
      if (a.balance > 0 && b.balance === 0) return -1;
      if (a.balance === 0 && b.balance > 0) return 1;

      // Jika keduanya 0 atau keduanya > 0, native token di atas
      if (a.isNative && !b.isNative) return -1;
      if (!a.isNative && b.isNative) return 1;

      // Akhirnya sort berdasarkan value (balance * price)
      const aValue = a.balance * (a.priceUSD || 0);
      const bValue = b.balance * (b.priceUSD || 0);
      return bValue - aValue;
    });
  };

  // Get token list based on selected chain
  let tokenList: TokenWithBalance[] = [];
  
  if (chain === 'all') {
    // Kumpulkan semua native token terlebih dahulu
    const nativeTokens = Object.keys(CHAINS).map(chainId => {
      const nativeInfo = getNativeTokenInfo(chainId);
      const balance = walletBalances[chainId]?.[nativeInfo.symbol.toLowerCase()] || 
                     walletBalances[chainId]?.[nativeInfo.symbol] || '0';
      const price = tokenPrices[nativeInfo.symbol] || { priceUSD: 0, priceChange24h: 0 };
      
      return {
        symbol: nativeInfo.symbol,
        name: nativeInfo.name,
        logo: nativeInfo.logo,
        balance: parseFloat(balance),
        priceUSD: price.priceUSD,
        priceChange24h: price.priceChange24h,
        chains: [chainId.toUpperCase()],
        isMerged: false,
        isNative: true,
        address: '',
        decimals: 18
      };
    });

    // Kumpulkan semua stablecoin dari semua chain
    const stablecoins: Record<string, TokenWithBalance> = {};
    Object.keys(CHAINS).forEach(chainId => {
      const chainConfig = CHAINS[chainId as keyof typeof CHAINS];
      const stableTokens = chainConfig.tokens.filter(t => ['USDT', 'USDC'].includes(t.symbol));
      
      stableTokens.forEach(token => {
        const balance = walletBalances[chainId]?.[token.symbol.toLowerCase()] || 
                       walletBalances[chainId]?.[token.symbol] || '0';
        const price = tokenPrices[token.symbol] || { priceUSD: 0, priceChange24h: 0 };
        
        if (!stablecoins[token.symbol]) {
          stablecoins[token.symbol] = {
            ...token,
            balance: 0,
            priceUSD: price.priceUSD,
            priceChange24h: price.priceChange24h,
            chains: [],
            isMerged: true,
            isNative: false
          };
        }
        
        const tokenBalance = parseFloat(balance);
        stablecoins[token.symbol].balance += tokenBalance;
        if (tokenBalance > 0) {
          stablecoins[token.symbol].chains.push(chainId.toUpperCase());
        }
      });
    });

    // Gabungkan native tokens dan stablecoins
    tokenList = [...nativeTokens, ...Object.values(stablecoins)];
  } else {
    // Chain spesifik
    const chainConfig = CHAINS[chain as keyof typeof CHAINS];
    if (!chainConfig) {
      throw new Error(`Invalid chain: ${chain}`);
    }

    // Selalu tambahkan native token
    const nativeToken = chainConfig.tokens.find(t => t.isNative);
    if (nativeToken) {
      const balance = activeBalances[nativeToken.symbol.toLowerCase()] || 
                     activeBalances[nativeToken.symbol] || '0';
      const price = tokenPrices[nativeToken.symbol] || { priceUSD: 0, priceChange24h: 0 };
      
      tokenList.push({
        ...nativeToken,
        balance: parseFloat(balance),
        priceUSD: price.priceUSD,
        priceChange24h: price.priceChange24h,
        chains: [chain.toUpperCase()],
        isMerged: false,
        isNative: true
      });
    }

    // Tambahkan token lainnya
    chainConfig.tokens
      .filter(t => !t.isNative)
      .forEach(token => {
        const balance = activeBalances[token.symbol.toLowerCase()] || 
                       activeBalances[token.symbol] || '0';
        const price = tokenPrices[token.symbol] || { priceUSD: 0, priceChange24h: 0 };
        
        tokenList.push({
          ...token,
          balance: parseFloat(balance),
          priceUSD: price.priceUSD,
          priceChange24h: price.priceChange24h,
          chains: [chain.toUpperCase()],
          isMerged: false,
          isNative: false
        });
      });
  }

  // Sort token list
  tokenList = sortTokens(tokenList);

  // Calculate total portfolio value
  const totalValue = tokenList.reduce((sum, token) => {
    return sum + (token.balance * (token.priceUSD || 0));
  }, 0);

  return (
    <div className="flex-1 flex flex-col">
      <div className="p-4 border-b border-crypto-border">
        <div className="text-sm text-gray-400 mb-1">Total Portfolio Value</div>
        <div className="text-2xl font-bold">
          ${totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
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
            isNative={token.isNative}
          />
        ))}
      </div>
    </div>
  );
} 