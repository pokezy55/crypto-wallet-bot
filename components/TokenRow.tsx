import React from 'react';

export interface TokenRowProps {
  symbol: string;
  name: string;
  logo: string;
  balance: number;
  priceUSD: number;
}

const TokenRow: React.FC<TokenRowProps> = ({ symbol, name, logo, balance, priceUSD }) => {
  const fiatValue = balance * priceUSD;
  return (
    <div className="flex items-center justify-between p-3 bg-crypto-card rounded-lg border border-crypto-border hover:bg-crypto-card/80 transition-colors">
      {/* Logo */}
      <div className="flex items-center gap-3">
        <img src={logo} alt={symbol} className="w-8 h-8 rounded-full bg-gray-800 object-contain" width={32} height={32} />
        <div>
          <div className="font-semibold text-white text-base">{name}</div>
          <div className="text-xs text-gray-400">${priceUSD.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
        </div>
      </div>
      {/* Balance & USD Value */}
      <div className="text-right">
        <div className="font-semibold text-white text-base">{balance.toFixed(4)}</div>
        <div className="text-xs text-gray-400">${fiatValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
      </div>
    </div>
  );
};

export default TokenRow; 
 