import { useState } from 'react';
import { isValidAddress } from '@/lib/address';
import { BaseModal, ActionModalProps, LoadingSpinner, ErrorMessage, SuccessMessage } from './ActionModal';

interface SendFormState {
  address: string;
  amount: string;
}

export default function SendModal({ isOpen, onClose, selectedToken, chain, wallet }: ActionModalProps) {
  // Early return if no token selected
  if (!isOpen || !selectedToken) return null;

  // States
  const [form, setForm] = useState<SendFormState>({ address: '', amount: '' });
  const [status, setStatus] = useState<'idle' | 'pending' | 'success' | 'error'>('idle');
  const [error, setError] = useState('');

  // Validation
  const isAddressValid = form.address ? isValidAddress(form.address) : false;
  const isAmountValid = form.amount && parseFloat(form.amount) > 0 && 
    parseFloat(form.amount) <= selectedToken.balance;
  const isFormValid = isAddressValid && isAmountValid;

  // Estimated fee for native tokens
  const estimatedFee = selectedToken.isNative ? 0.001 : 0;

  // Handle max amount
  const handleMax = () => {
    if (selectedToken.isNative) {
      const maxAmount = Math.max(0, selectedToken.balance - estimatedFee);
      setForm(prev => ({ ...prev, amount: maxAmount.toFixed(6) }));
    } else {
      setForm(prev => ({ ...prev, amount: selectedToken.balance.toFixed(6) }));
    }
  };

  // Handle send
  const handleSend = async () => {
    if (!isFormValid || !wallet.seedPhrase) return;

    setStatus('pending');
    setError('');

    try {
      const response = await fetch('/api/transaction/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from: wallet.address,
          to: form.address,
          token: selectedToken.symbol,
          chain,
          amount: form.amount,
          seedPhrase: wallet.seedPhrase
        })
      });

      const result = await response.json();
      
      if (response.ok && result.success) {
        setStatus('success');
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
          <LoadingSpinner />
          <p className="mt-2">Processing transaction...</p>
        </div>
      </BaseModal>
    );
  }

  if (status === 'success') {
    return (
      <BaseModal isOpen={isOpen} onClose={handleClose} title="Success">
        <SuccessMessage 
          message="Transaction sent successfully!" 
          onClose={handleClose}
        />
      </BaseModal>
    );
  }

  if (status === 'error') {
    return (
      <BaseModal isOpen={isOpen} onClose={handleClose} title="Error">
        <ErrorMessage 
          message={error} 
          onRetry={() => setStatus('idle')}
        />
      </BaseModal>
    );
  }

  return (
    <BaseModal isOpen={isOpen} onClose={handleClose} title={`Send ${selectedToken.symbol}`}>
      <div className="space-y-4">
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
              max={selectedToken.isNative ? selectedToken.balance - estimatedFee : selectedToken.balance}
            />
            <button
              onClick={handleMax}
              className="btn-secondary px-3"
            >
              MAX
            </button>
          </div>
          <p className="text-xs text-gray-400 mt-1">
            Available: {selectedToken.balance.toFixed(6)} {selectedToken.symbol}
          </p>
        </div>

        {/* Network Fee */}
        {selectedToken.isNative && (
          <p className="text-xs text-gray-400">
            Estimated Network Fee: {estimatedFee} {selectedToken.symbol}
          </p>
        )}

        {/* Send Button */}
        <button
          onClick={handleSend}
          disabled={!isFormValid}
          className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Send {selectedToken.symbol}
        </button>
      </div>
    </BaseModal>
  );
} 