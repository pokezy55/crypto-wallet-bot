import React from 'react';
import { Globe } from 'lucide-react';
import { Eth, Bnb, Pol, Base } from './TokenIcons';
import { Token } from './ActionModal';

interface TokenRowProps {
  token: Token;
  onSend: () => void;
  onReceive: () => void;
  onSwap: () => void;
}

const getTokenIcon = (symbol: string, fallback: string) => {
  // Web3Icons CDN: https://cdn.web3icons.dev/tokens/{symbol}.svg
  // symbol harus lowercase
  return (
    <img
      src={`https://cdn.web3icons.dev/tokens/${symbol.toLowerCase()}.svg`}
      alt={symbol}
      className="w-7 h-7 rounded-full bg-white object-contain"
      onError={(e) => { (e.target as HTMLImageElement).src = fallback; }}
    />
  );
};

export default function TokenRow({ token, onSend, onReceive, onSwap }: TokenRowProps) {
  const balanceUSD = token.balance * token.priceUSD;
  const changeColor = token.priceChange24h > 0 ? 'text-green-500' : token.priceChange24h < 0 ? 'text-red-500' : 'text-gray-400';

  return (
    <div className="flex items-center justify-between p-3 bg-crypto-dark rounded-lg">
      <div className="flex items-center gap-3">
        {/* Token Icon */}
        {getTokenIcon(token.symbol, token.logo || '')}
        <div>
          <div className="font-medium">{token.symbol}</div>
          <div className="text-xs text-gray-400">{token.name}</div>
        </div>
      </div>
      <div className="text-right">
        <div className="font-medium">{token.balance.toFixed(4)} {token.symbol}</div>
        <div className="text-xs text-gray-400">${balanceUSD.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
      </div>
    </div>
  );
} 
 