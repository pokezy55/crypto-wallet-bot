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
}

export default function TokenRow({ 
  symbol, 
  name, 
  logo, 
  balance = 0, 
  priceUSD = 0, 
  priceChange24h = 0,
  chains = [],
  isMerged = false
}: TokenRowProps) {
  const balanceUSD = balance * priceUSD;
  const changeColor = priceChange24h > 0 ? 'text-green-500' : priceChange24h < 0 ? 'text-red-500' : 'text-gray-400';

  const chainIcons: Record<string, JSX.Element> = {
    'ETH': <Eth className="w-4 h-4" />,
    'BSC': <Bnb className="w-4 h-4" />,
    'POLYGON': <Pol className="w-4 h-4" />,
    'BASE': <Base className="w-4 h-4" />
  };

  return (
    <div className="p-3 bg-crypto-card rounded-lg border border-crypto-border flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center">
          {logo ? (
            <img src={logo} alt={symbol} className="w-6 h-6" />
          ) : (
            <span className="text-sm font-bold">{symbol.slice(0, 2)}</span>
          )}
        </div>
        <div>
          <div className="font-medium">{name || symbol}</div>
          <div className="text-xs text-gray-400 flex items-center gap-1">
            {chains.map((chain, idx) => (
              <span key={chain} className="flex items-center">
                {idx > 0 && <span className="mx-1">•</span>}
                {chainIcons[chain] || chain}
              </span>
            ))}
          </div>
        </div>
      </div>
      <div className="text-right">
        <div className="font-medium">{balance.toFixed(4)} {symbol}</div>
        <div className="text-xs text-gray-400">${balanceUSD.toFixed(2)}</div>
      </div>
    </div>
  );
} 
 