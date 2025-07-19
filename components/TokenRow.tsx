import React from 'react';

interface Token {
  symbol: string;
  name: string;
  logo?: string;
  balance: string;
  decimals: number;
  isNative: boolean;
  address?: string;
  chain: string;
  price: number;
  change: number;
}

interface TokenRowProps {
  token: Token;
  onSend: () => void;
  onReceive: () => void;
  onSwap: () => void;
}

export default function TokenRow({ token, onSend, onReceive, onSwap }: TokenRowProps) {
  const balance = parseFloat(token.balance);
  const balanceUSD = balance * token.price;
  const changeColor = token.change > 0 ? 'text-green-500' : token.change < 0 ? 'text-red-500' : 'text-gray-400';

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
          </div>
          <div className="text-xs text-gray-400 flex items-center gap-2">
            <span>${token.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 })}</span>
            {token.change !== 0 && (
              <span className={changeColor}>
                {token.change > 0 ? '+' : ''}{token.change.toFixed(2)}%
              </span>
            )}
          </div>
        </div>
      </div>
      <div className="text-right">
        <div className="font-medium">{balance.toFixed(6)} {token.symbol}</div>
        <div className="text-xs text-gray-400">${balanceUSD.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
      </div>
      <div className="flex gap-2 ml-4">
        <button
          onClick={onSend}
          className="px-3 py-1 text-sm rounded-lg hover:bg-crypto-hover"
        >
          Send
        </button>
        <button
          onClick={onReceive}
          className="px-3 py-1 text-sm rounded-lg hover:bg-crypto-hover"
        >
          Receive
        </button>
        <button
          onClick={onSwap}
          className="px-3 py-1 text-sm rounded-lg hover:bg-crypto-hover"
        >
          Swap
        </button>
      </div>
    </div>
  );
} 
 