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

export default function TokenRow({ token, onSend, onReceive, onSwap }: TokenRowProps) {
  const balanceUSD = token.balance * token.priceUSD;
  const changeColor = token.priceChange24h > 0 ? 'text-green-500' : token.priceChange24h < 0 ? 'text-red-500' : 'text-gray-400';

  return (
    <div className="p-3 bg-crypto-card rounded-lg border border-crypto-border flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center">
          {token.logo ? (
            <img src={token.logo} alt={token.symbol} className="w-6 h-6" />
          ) : (
            <span className="text-sm font-bold">{token.symbol.slice(0, 2)}</span>
          )}
        </div>
        <div>
          <div className="font-medium flex items-center gap-2">
            <span>{token.name || token.symbol}</span>
            {token.chains.length > 1 && (
              <span className="text-xs bg-primary-500/20 text-primary-500 px-1.5 py-0.5 rounded-full">
                Multi-chain
              </span>
            )}
          </div>
          <div className="text-xs text-gray-400 flex items-center gap-2">
            <span>${token.priceUSD.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 })}</span>
            <span className={changeColor}>
              {token.priceChange24h > 0 ? '+' : ''}{token.priceChange24h.toFixed(2)}%
            </span>
          </div>
        </div>
      </div>
      <div className="text-right">
        <div className="font-medium">{token.balance.toFixed(4)} {token.symbol}</div>
        <div className="text-xs text-gray-400">${balanceUSD.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
      </div>
    </div>
  );
} 
 