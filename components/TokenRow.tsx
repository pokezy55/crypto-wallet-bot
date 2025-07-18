import React from 'react';

export interface TokenRowProps {
  symbol: string;
  name: string;
  logo: string;
  balance: number;
  priceUSD: number;
  priceChange24h?: number;
}

const TokenRow: React.FC<TokenRowProps> = ({ symbol, name, logo, balance, priceUSD, priceChange24h }) => {
  const fiatValue = balance * priceUSD;
  const change = priceChange24h ?? 0;
  const changeColor = change > 0 ? 'text-green-500' : change < 0 ? 'text-red-500' : 'text-gray-400';
  
  return (
    <div className="flex items-center justify-between p-3 bg-crypto-card rounded-lg border border-crypto-border hover:bg-crypto-card/80 transition-colors">
      {/* Logo & Name */}
      <div className="flex items-center gap-3">
        <img src={logo} alt={symbol} className="w-8 h-8 rounded-full bg-gray-800 object-contain" width={32} height={32} />
        <div>
          <div className="font-semibold text-white text-base">{name}</div>
          <div className="text-xs flex gap-2 items-center">
            <span className="text-gray-400">${priceUSD.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            {priceChange24h !== undefined && (
              <span className={changeColor}>
                {change > 0 ? '+' : ''}{change.toFixed(2)}%
              </span>
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
 