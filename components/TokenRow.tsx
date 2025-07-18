import React from 'react';
import { Globe } from 'lucide-react';

export interface TokenRowProps {
  symbol: string;
  name: string;
  logo: string;
  balance: number;
  priceUSD: number;
  priceChange24h?: number;
  chains?: string[];  // List chain untuk token yang di-merge
  isMerged?: boolean; // Flag untuk token yang di-merge
}

const TokenRow: React.FC<TokenRowProps> = ({ 
  symbol, 
  name, 
  logo, 
  balance, 
  priceUSD, 
  priceChange24h,
  chains = [],
  isMerged = false
}) => {
  const fiatValue = balance * priceUSD;
  const change = priceChange24h ?? 0;
  const changeColor = change > 0 ? 'text-green-500' : change < 0 ? 'text-red-500' : 'text-gray-400';
  
  return (
    <div className="flex items-center justify-between p-3 bg-crypto-card rounded-lg border border-crypto-border hover:bg-crypto-card/80 transition-colors">
      {/* Logo & Name */}
      <div className="flex items-center gap-3">
        <img src={logo} alt={symbol} className="w-8 h-8 rounded-full bg-gray-800 object-contain" width={32} height={32} />
        <div>
          <div className="flex items-center gap-2">
            <span className="font-semibold text-white text-base">{name}</span>
            {isMerged && (
              <span className="px-2 py-0.5 text-xs bg-primary-500/20 text-primary-500 rounded-full flex items-center gap-1">
                <Globe className="w-3 h-3" />
                Multi-chain
              </span>
            )}
          </div>
          <div className="text-xs flex gap-2 items-center">
            <span className="text-gray-400">${priceUSD.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            {priceChange24h !== undefined && (
              <span className={changeColor}>
                {change > 0 ? '+' : ''}{change.toFixed(2)}%
              </span>
            )}
            {isMerged && chains.length > 0 && (
              <span className="text-gray-500">({chains.join(', ')})</span>
            )}
          </div>
        </div>
      </div>
      {/* Balance & USD Value */}
      <div className="text-right">
        <div className="font-semibold text-white text-base">{balance.toFixed(4)} {symbol}</div>
        <div className="text-xs text-gray-400">${fiatValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
      </div>
    </div>
  );
};

export default TokenRow; 
 