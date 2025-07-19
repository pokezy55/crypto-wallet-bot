import React from 'react';
import { Globe } from 'lucide-react';
import { Eth, Bnb, Pol, Base } from './TokenIcons';

interface TokenRowProps {
  symbol: string;
  name: string;
  logo: string;
  balance: number;
  priceUSD: number;
  priceChange24h?: number;
  chains: string[];
  isMerged?: boolean;
  isNative?: boolean;
}

export default function TokenRow({ 
  symbol, 
  name, 
  logo, 
  balance = 0, 
  priceUSD = 0, 
  priceChange24h = 0,
  chains = [],
  isMerged = false,
  isNative = false
}: TokenRowProps) {
  const balanceUSD = balance * priceUSD;
  const changeColor = priceChange24h > 0 ? 'text-green-500' : priceChange24h < 0 ? 'text-red-500' : 'text-gray-400';

  return (
    <div className={`p-3 bg-crypto-card rounded-lg border ${isNative ? 'border-primary-500/20' : 'border-crypto-border'} flex items-center justify-between`}>
      <div className="flex items-center gap-3">
        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isNative ? 'bg-primary-500/10' : 'bg-gray-800'}`}>
          {logo ? (
            <img src={logo} alt={symbol} className="w-6 h-6" />
          ) : (
            <span className="text-sm font-bold">{symbol.slice(0, 2)}</span>
          )}
        </div>
        <div>
          <div className="font-medium flex items-center gap-2">
            <span>{name || symbol}</span>
            {isMerged && (
              <span className="text-xs bg-primary-500/20 text-primary-500 px-1.5 py-0.5 rounded-full">
                Multi-chain
              </span>
            )}
            {isNative && !isMerged && chains[0] && (
              <span className="text-xs bg-primary-500/10 text-primary-500 px-1.5 py-0.5 rounded-full">
                {chains[0]}
              </span>
            )}
          </div>
          <div className="text-xs text-gray-400 flex items-center gap-2">
            <span>${priceUSD.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 })}</span>
            {priceChange24h !== 0 && (
              <span className={changeColor}>
                {priceChange24h > 0 ? '+' : ''}{priceChange24h.toFixed(2)}%
              </span>
            )}
          </div>
        </div>
      </div>
      <div className="text-right">
        <div className="font-medium">{balance.toFixed(4)} {symbol}</div>
        <div className="text-xs text-gray-400">${balanceUSD.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
      </div>
    </div>
  );
} 
 