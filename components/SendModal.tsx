import { useState } from 'react';
import { isValidAddress } from '@/lib/address';
import { BaseModal } from './ActionModal';
import { getTokenList } from '@/lib/chain';
import toast from 'react-hot-toast';

interface SendFormState {
  address: string;
  amount: string;
}

interface Token {
  symbol: string;
  name: string;
  logo?: string;
  balance: number;
  isNative: boolean;
  chains: string[];
  priceUSD?: number;
  decimals?: number;
  address?: string;
}

interface SendModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedToken?: Token;
  chain: string;
  wallet?: {
    address: string;
    seedPhrase?: string;
  };
}

export default function SendModal({ isOpen, onClose, selectedToken, chain, wallet }: SendModalProps) {
  // Early validation of required props
  if (!isOpen || !wallet?.address) {
    return null;
  }

  // Get available tokens for the current chain
  const availableTokens = getTokenList(chain) as Token[];
  const defaultToken = selectedToken || availableTokens[0];

  // States
  const [form, setForm] = useState<SendFormState>({ address: '', amount: '' });
  const [status, setStatus] = useState<'idle' | 'pending' | 'success' | 'error'>('idle');
  const [error, setError] = useState('');
  const [selectedTokenState, setSelectedTokenState] = useState<Token>(defaultToken);

  // Validation
  const isAddressValid = form.address ? isValidAddress(form.address) : false;
  const isAmountValid = form.amount && parseFloat(form.amount) > 0 && 
    parseFloat(form.amount) <= selectedTokenState.balance;
  const isFormValid = isAddressValid && isAmountValid && selectedTokenState;

  // Estimated fee for native tokens
  const estimatedFee = selectedTokenState.isNative ? 0.001 : 0;

  // Handle max amount
  const handleMax = () => {
    if (selectedTokenState.isNative) {
      const maxAmount = Math.max(0, selectedTokenState.balance - estimatedFee);
      setForm(prev => ({ ...prev, amount: maxAmount.toFixed(6) }));
    } else {
      setForm(prev => ({ ...prev, amount: selectedTokenState.balance.toFixed(6) }));
    }
  };

  // Handle token change
  const handleTokenChange = (symbol: string) => {
    const token = availableTokens.find(t => t.symbol === symbol);
    if (token) {
      setSelectedTokenState(token);
      setForm(prev => ({ ...prev, amount: '' }));
    }
  };

  // Handle send
  const handleSend = async () => {
    if (!isFormValid || !wallet.seedPhrase) return;

    setStatus('pending');
    setError('');

    try {
      // Validate chain matches token
      if (!selectedTokenState.chains.includes(chain.toUpperCase())) {
        throw new Error(`${selectedTokenState.symbol} is not available on ${chain} network`);
      }

      const response = await fetch('/api/transaction/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from: wallet.address,
          to: form.address,
          token: selectedTokenState.symbol,
          chain,
          amount: form.amount,
          seedPhrase: wallet.seedPhrase
        })
      });

      const result = await response.json();
      
      if (response.ok && result.success) {
        setStatus('success');
        // Show warning if token price is not available
        if (!selectedTokenState.priceUSD) {
          toast.error(`Price data not available for ${selectedTokenState.symbol}`);
        }
      } else {
        throw new Error(result.error || 'Failed to send transaction');
      }
    } catch (error: unknown) {
      console.error('Send transaction error:', error);
      setStatus('error');
      setError(error instanceof Error ? error.message : 'Failed to send transaction');
    }
  };

  // Handle close
  const handleClose = () => {
    setForm({ address: '', amount: '' });
    setStatus('idle');
    setError('');
    onClose();
  };

  // Render different states
  if (status === 'pending') {
    return (
      <BaseModal isOpen={isOpen} onClose={handleClose} title="Sending">
        <div className="text-center py-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500 mx-auto mb-2"></div>
          <p>Processing transaction...</p>
        </div>
      </BaseModal>
    );
  }

  if (status === 'success') {
    return (
      <BaseModal isOpen={isOpen} onClose={handleClose} title="Success">
        <div className="text-center">
          <p className="text-green-500 mb-4">Transaction sent successfully!</p>
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
    <BaseModal isOpen={isOpen} onClose={handleClose} title="Send">
      <div className="space-y-4">
        {/* Token Selector */}
        <div>
          <label className="block text-sm font-medium mb-2">Token</label>
          <select
            value={selectedTokenState.symbol}
            onChange={(e) => handleTokenChange(e.target.value)}
            className="input-field w-full"
          >
            {availableTokens.map((token) => (
              <option key={token.symbol} value={token.symbol}>
                {token.name} ({token.symbol})
                {!token.priceUSD && ' - No price data'}
              </option>
            ))}
          </select>
          {selectedTokenState && !selectedTokenState.priceUSD && (
            <p className="text-yellow-500 text-xs mt-1">
              Warning: Price data not available for this token
            </p>
          )}
        </div>

        {/* Recipient Address */}
        <div>
          <label className="block text-sm font-medium mb-2">Recipient Address</label>
          <input
            type="text"
            value={form.address}
            onChange={e => setForm(prev => ({ ...prev, address: e.target.value }))}
            placeholder="0x..."
            className="input-field w-full"
          />
          {form.address && !isAddressValid && (
            <p className="text-red-500 text-xs mt-1">Invalid address</p>
          )}
        </div>

        {/* Amount */}
        <div>
          <label className="block text-sm font-medium mb-2">Amount</label>
          <div className="flex gap-2">
            <input
              type="number"
              value={form.amount}
              onChange={e => setForm(prev => ({ ...prev, amount: e.target.value }))}
              placeholder="0.0"
              className="input-field flex-1"
              min="0"
              step="any"
              max={selectedTokenState.isNative ? selectedTokenState.balance - estimatedFee : selectedTokenState.balance}
            />
            <button
              onClick={handleMax}
              className="btn-secondary px-3"
            >
              MAX
            </button>
          </div>
          <p className="text-xs text-gray-400 mt-1">
            Available: {selectedTokenState.balance.toFixed(6)} {selectedTokenState.symbol}
          </p>
        </div>

        {/* Network Fee */}
        {selectedTokenState.isNative && (
          <p className="text-xs text-gray-400">
            Estimated Network Fee: {estimatedFee} {selectedTokenState.symbol}
          </p>
        )}

        {/* Network Warning */}
        {selectedTokenState && !selectedTokenState.chains.includes(chain.toUpperCase()) && (
          <p className="text-red-500 text-sm">
            Warning: {selectedTokenState.symbol} is not available on {chain} network
          </p>
        )}

        {/* Send Button */}
        <button
          onClick={handleSend}
          disabled={!isFormValid}
          className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Send {selectedTokenState.symbol}
        </button>
      </div>
    </BaseModal>
  );
} 