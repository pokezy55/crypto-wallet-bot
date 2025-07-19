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
  const fiatValue = balance * (token.price || 0);

  return (
    <div className="flex items-center justify-between p-3 hover:bg-crypto-hover rounded-lg">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 flex items-center justify-center">
          {token.logo ? (
            <img src={token.logo} alt={token.symbol} className="w-8 h-8" />
          ) : (
            <div className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center">
              <span className="text-sm font-bold">{token.symbol.slice(0, 2)}</span>
            </div>
          )}
        </div>
        <div>
          <div className="font-medium">{token.symbol}</div>
          <div className="text-sm text-gray-400">${token.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
        </div>
      </div>
      <div className="text-right">
        <div className="font-medium">{balance.toFixed(6)}</div>
        <div className="text-sm text-gray-400">
          ${fiatValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          {token.change !== 0 && (
            <span className={token.change >= 0 ? 'text-green-500 ml-1' : 'text-red-500 ml-1'}>
              {token.change > 0 ? '+' : ''}{token.change.toFixed(2)}%
            </span>
          )}
        </div>
      </div>
      <div className="flex gap-2 ml-4">
        <button
          onClick={onSend}
          className="text-sm text-blue-500 hover:text-blue-600"
        >
          Send
        </button>
        <button
          onClick={onReceive}
          className="text-sm text-blue-500 hover:text-blue-600"
        >
          Receive
        </button>
        <button
          onClick={onSwap}
          className="text-sm text-blue-500 hover:text-blue-600"
        >
          Swap
        </button>
      </div>
    </div>
  );
} 
 