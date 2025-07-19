import { useState } from 'react';
import { ArrowLeftRight } from 'lucide-react';
import { BaseModal } from './BaseModal';

interface Token {
  symbol: string;
  name: string;
  logo?: string;
  balance: number;
  priceUSD: number;
}

interface SwapModalProps {
  isOpen: boolean;
  onClose: () => void;
  tokens: Token[];
  chain: string;
  wallet?: {
    address: string;
    seedPhrase?: string;
    privateKey?: string;
  };
}

interface SwapFormState {
  fromToken: string;
  toToken: string;
  amount: string;
}

export default function SwapModal({ isOpen, onClose, tokens, chain, wallet }: SwapModalProps) {
  // Early validation of required props
  if (!isOpen || !tokens?.length || !wallet?.address) {
    return null;
  }

  // Form state
  const [form, setForm] = useState<SwapFormState>({
    fromToken: tokens[0]?.symbol || '',
    toToken: tokens[1]?.symbol || '',
    amount: ''
  });
  const [status, setStatus] = useState<'idle' | 'pending' | 'success' | 'error'>('idle');
  const [error, setError] = useState('');

  // Get token objects
  const fromToken = tokens.find(t => t.symbol === form.fromToken);
  const toToken = tokens.find(t => t.symbol === form.toToken);

  // Validation
  const isAmountValid = form.amount && parseFloat(form.amount) > 0 && 
    fromToken && parseFloat(form.amount) <= fromToken.balance;
  const isFormValid = isAmountValid && fromToken && toToken && form.fromToken !== form.toToken;

  // Calculate estimated output
  const getEstimatedOutput = () => {
    if (!fromToken || !toToken || !form.amount || !isAmountValid) return '';
    const input = parseFloat(form.amount);
    const rate = toToken.priceUSD / fromToken.priceUSD;
    return (input * rate).toFixed(6);
  };

  // Handle swap
  const handleSwap = async () => {
    if (!isFormValid || !wallet.seedPhrase) return;

    setStatus('pending');
    setError('');

    try {
      const response = await fetch('/api/transaction/swap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from: wallet.address,
          fromToken: form.fromToken,
          toToken: form.toToken,
          amount: form.amount,
          chain,
          seedPhrase: wallet.seedPhrase
        })
      });

      const result = await response.json();
      
      if (response.ok && result.success) {
        setStatus('success');
      } else {
        throw new Error(result.error || 'Failed to execute swap');
      }
    } catch (error: unknown) {
      console.error('Swap error:', error);
      setStatus('error');
      setError(error instanceof Error ? error.message : 'Failed to execute swap');
    }
  };

  // Handle close
  const handleClose = () => {
    setForm({ fromToken: tokens[0]?.symbol || '', toToken: tokens[1]?.symbol || '', amount: '' });
    setStatus('idle');
    setError('');
    onClose();
  };

  // Render different states
  if (status === 'pending') {
    return (
      <BaseModal isOpen={isOpen} onClose={handleClose} title="Swapping">
        <div className="text-center py-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500 mx-auto mb-2"></div>
          <p>Processing swap...</p>
        </div>
      </BaseModal>
    );
  }

  if (status === 'success') {
    return (
      <BaseModal isOpen={isOpen} onClose={handleClose} title="Success">
        <div className="text-center">
          <p className="text-green-500 mb-4">Swap executed successfully!</p>
          <button onClick={handleClose} className="btn-primary w-full">
            Done
          </button>
        </div>
      </BaseModal>
    );
  }

  if (status === 'error') {
    return (
      <BaseModal isOpen={isOpen} onClose={handleClose} title="Error">
        <div className="text-center">
          <p className="text-red-500 mb-4">{error}</p>
          <button
            onClick={() => setStatus('idle')}
            className="btn-primary w-full"
          >
            Try Again
          </button>
        </div>
      </BaseModal>
    );
  }

  return (
    <BaseModal isOpen={isOpen} onClose={handleClose} title="Swap">
      <div className="space-y-4">
        {/* From Token */}
        <div>
          <label className="block text-sm font-medium mb-2">From</label>
          <div className="flex gap-2">
            <input
              type="number"
              value={form.amount}
              onChange={e => setForm(prev => ({ ...prev, amount: e.target.value }))}
              placeholder="0.0"
              className="input-field flex-1"
              min="0"
              step="any"
              max={fromToken?.balance || 0}
            />
            <select
              value={form.fromToken}
              onChange={e => setForm(prev => ({ ...prev, fromToken: e.target.value }))}
              className="input-field w-24"
            >
              {tokens.map(token => (
                <option key={token.symbol} value={token.symbol}>
                  {token.symbol}
                </option>
              ))}
            </select>
          </div>
          {fromToken && (
            <p className="text-xs text-gray-400 mt-1">
              Available: {fromToken.balance.toFixed(6)} {fromToken.symbol}
            </p>
          )}
        </div>

        {/* Swap Direction */}
        <div className="text-center">
          <button
            onClick={() => setForm(prev => ({
              ...prev,
              fromToken: prev.toToken,
              toToken: prev.fromToken,
              amount: ''
            }))}
            className="p-2 rounded-full bg-crypto-card border border-crypto-border hover:bg-crypto-dark"
          >
            <ArrowLeftRight className="w-5 h-5" />
          </button>
        </div>

        {/* To Token */}
        <div>
          <label className="block text-sm font-medium mb-2">To (Estimated)</label>
          <div className="flex gap-2">
            <input
              type="text"
              value={getEstimatedOutput()}
              readOnly
              placeholder="0.0"
              className="input-field flex-1 bg-crypto-dark"
            />
            <select
              value={form.toToken}
              onChange={e => setForm(prev => ({ ...prev, toToken: e.target.value }))}
              className="input-field w-24"
            >
              {tokens.map(token => (
                <option key={token.symbol} value={token.symbol}>
                  {token.symbol}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Price Info */}
        {fromToken && toToken && isAmountValid && (
          <div className="text-sm text-gray-400">
            <p>Rate: 1 {fromToken.symbol} = {(toToken.priceUSD / fromToken.priceUSD).toFixed(6)} {toToken.symbol}</p>
          </div>
        )}

        {/* Swap Button */}
        <button
          onClick={handleSwap}
          disabled={!isFormValid}
          className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {!fromToken || !toToken ? 'Select tokens' :
           !isAmountValid ? 'Enter amount' :
           form.fromToken === form.toToken ? 'Select different tokens' :
           `Swap ${fromToken.symbol} to ${toToken.symbol}`}
        </button>
      </div>
    </BaseModal>
  );
} 