import { useState } from 'react';
import { isValidAddress } from '@/lib/address';
import { BaseModal } from './ActionModal';
import { getTokenList } from '@/lib/chain';
import { useSendTransaction } from '@/hooks/useSendTransaction';
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
  decimals: number;
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
  const [selectedTokenState, setSelectedTokenState] = useState<Token>(defaultToken);

  // Use send transaction hook
  const { sendTransaction, loading, error } = useSendTransaction();

  // Validation
  const isAddressValid = form.address ? isValidAddress(form.address) : false;
  
  // Amount validation
  const validateAmount = (amount: string): boolean => {
    if (!amount) return false;
    
    // Remove commas and spaces
    const cleanAmount = amount.replace(/,/g, '').trim();
    
    // Check format
    if (!/^\d*\.?\d*$/.test(cleanAmount)) return false;
    
    // Parse value
    const value = parseFloat(cleanAmount);
    if (isNaN(value) || value <= 0) return false;
    
    // Check against balance
    return value <= selectedTokenState.balance;
  };

  const isAmountValid = validateAmount(form.amount);
  const isFormValid = isAddressValid && isAmountValid && selectedTokenState;

  // Estimated fee for native tokens
  const estimatedFee = selectedTokenState.isNative ? 0.001 : 0;

  // Handle amount change
  const handleAmountChange = (value: string) => {
    // Allow only numbers and one decimal point
    if (value === '' || /^\d*\.?\d*$/.test(value)) {
      setForm(prev => ({ ...prev, amount: value }));
    }
  };

  // Handle max amount
  const handleMax = () => {
    if (selectedTokenState.isNative) {
      const maxAmount = Math.max(0, selectedTokenState.balance - estimatedFee);
      setForm(prev => ({ ...prev, amount: maxAmount.toFixed(selectedTokenState.decimals) }));
    } else {
      setForm(prev => ({ ...prev, amount: selectedTokenState.balance.toFixed(selectedTokenState.decimals) }));
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

    try {
      // Validate chain matches token
      if (!selectedTokenState.chains.includes(chain.toUpperCase())) {
        throw new Error(`${selectedTokenState.symbol} is not available on ${chain} network`);
      }

      const result = await sendTransaction({
        from: wallet.address,
        to: form.address,
        amount: form.amount,
        token: selectedTokenState,
        chain,
        seedPhrase: wallet.seedPhrase
      });

      if (result.success) {
        onClose();
        setForm({ address: '', amount: '' });
      }
    } catch (error: any) {
      console.error('Send error:', error);
      toast.error(error.message || 'Failed to send transaction');
    }
  };

  return (
    <BaseModal isOpen={isOpen} onClose={onClose} title="Send">
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
              </option>
            ))}
          </select>
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
              type="text"
              value={form.amount}
              onChange={e => handleAmountChange(e.target.value)}
              placeholder="0.0"
              className="input-field flex-1"
              pattern="^\d*\.?\d*$"
            />
            <button
              onClick={handleMax}
              className="btn-secondary px-3"
            >
              MAX
            </button>
          </div>
          <div className="flex justify-between text-xs mt-1">
            <p className="text-gray-400">
              Available: {selectedTokenState.balance.toFixed(selectedTokenState.decimals)} {selectedTokenState.symbol}
            </p>
            {form.amount && !isAmountValid && (
              <p className="text-red-500">Invalid amount</p>
            )}
          </div>
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
          disabled={!isFormValid || loading}
          className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <div className="flex items-center justify-center gap-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              <span>Sending...</span>
            </div>
          ) : (
            `Send ${selectedTokenState.symbol}`
          )}
        </button>
      </div>
    </BaseModal>
  );
} 