import { useState, useEffect } from 'react';
import { BaseModal } from './ActionModal';
import { getTokenList } from '@/lib/chain';
import { useSendTransaction } from '@/hooks/useSendTransaction';
import { useGasFee } from '@/hooks/useGasFee';
import { isValidEthereumAddress, isValidAmountFormat, formatAmount, isSensitiveData } from '@/lib/validation';
import toast from 'react-hot-toast';

// Format balance helper
function formatBalance(balance: string | number | undefined, decimals: number = 6): string {
  if (balance === undefined || balance === null) {
    return '0';
  }
  const num = typeof balance === 'string' ? parseFloat(balance) : balance;
  if (isNaN(num)) {
    return '0';
  }
  // Handle small numbers better
  if (num < 0.000001) {
    return num.toExponential(4);
  }
  return num.toFixed(decimals).replace(/\.?0+$/, '');
}

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
    privateKey?: string;
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
  const [validationErrors, setValidationErrors] = useState({
    address: '',
    amount: ''
  });
  const [status, setStatus] = useState<'idle' | 'pending' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  // Use hooks
  const { sendTransaction, loading, error } = useSendTransaction();
  const { fee: estimatedFee, feeUSD, loading: feeLoading, error: feeError } = useGasFee(
    chain,
    selectedTokenState.isNative
  );

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setForm({ address: '', amount: '' });
      setStatus('idle');
      setErrorMessage('');
    }
  }, [isOpen]);

  // Reset state when token changes
  useEffect(() => {
    if (selectedToken) {
      setSelectedTokenState(selectedToken);
      setForm(prev => ({ ...prev, amount: '' }));
    }
  }, [selectedToken]);

  // Real-time validation
  useEffect(() => {
    const errors = {
      address: '',
      amount: ''
    };

    // Validate address
    if (form.address) {
      if (isSensitiveData(form.address)) {
        errors.address = 'This looks like a private key or mnemonic. Please enter a recipient address.';
      } else if (!isValidEthereumAddress(form.address)) {
        errors.address = 'Invalid Ethereum address format';
      }
    }

    // Validate amount
    if (form.amount) {
      if (!isValidAmountFormat(form.amount)) {
        errors.amount = 'Invalid amount format';
      } else {
        const value = parseFloat(form.amount);
        if (selectedTokenState.isNative) {
          const fee = feeError ? 0 : parseFloat(estimatedFee || '0');
          const balance = parseFloat(selectedTokenState.balance?.toString() || '0');
          // Convert to same decimal places for comparison
          const valueWei = parseFloat(formatAmount(form.amount, selectedTokenState.decimals));
          const balanceWei = parseFloat(formatAmount(balance.toString(), selectedTokenState.decimals));
          const feeWei = parseFloat(formatAmount(fee.toString(), selectedTokenState.decimals));
          if (valueWei + feeWei > balanceWei) {
            errors.amount = 'Insufficient balance (including fee)';
          }
        } else {
          const balance = parseFloat(selectedTokenState.balance?.toString() || '0');
          // Convert to same decimal places for comparison
          const valueWei = parseFloat(formatAmount(form.amount, selectedTokenState.decimals));
          const balanceWei = parseFloat(formatAmount(balance.toString(), selectedTokenState.decimals));
          if (valueWei > balanceWei) {
            errors.amount = 'Insufficient balance';
          }
        }
      }
    }

    setValidationErrors(errors);
  }, [form, selectedTokenState, estimatedFee, feeError]);

  // Check if form is valid
  const isFormValid = !validationErrors.address && 
                     !validationErrors.amount && 
                     form.address && 
                     form.amount;

  // Handle amount change
  const handleAmountChange = (value: string) => {
    // Allow numbers, one decimal point, and scientific notation
    if (value === '' || /^[0-9]*\.?[0-9]*(?:[eE]-?[0-9]+)?$/.test(value)) {
      // Convert scientific notation to decimal if needed
      const num = value.includes('e') ? parseFloat(value) : value;
      setForm(prev => ({ ...prev, amount: num.toString() }));
    }
  };

  // Handle max amount
  const handleMax = () => {
    if (selectedTokenState.isNative) {
      // For native tokens, subtract estimated fee
      const fee = feeError ? 0 : parseFloat(estimatedFee || '0');
      const balance = parseFloat(selectedTokenState.balance?.toString() || '0');
      // Convert to same decimal places for comparison
      const balanceWei = parseFloat(formatAmount(balance.toString(), selectedTokenState.decimals));
      const feeWei = parseFloat(formatAmount(fee.toString(), selectedTokenState.decimals));
      const maxAmount = Math.max(0, balanceWei - feeWei);
      // Format the amount based on size
      const formattedAmount = maxAmount < 0.000001 ? maxAmount.toExponential(4) : formatBalance(maxAmount);
      setForm(prev => ({ ...prev, amount: formattedAmount }));
    } else {
      const balance = parseFloat(selectedTokenState.balance?.toString() || '0');
      // Format the amount based on size
      const formattedAmount = balance < 0.000001 ? balance.toExponential(4) : formatBalance(balance);
      setForm(prev => ({ ...prev, amount: formattedAmount }));
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
    if (!isFormValid) {
      toast.error('Please fill in all fields correctly');
      return;
    }

    if (!wallet?.address) {
      toast.error('Wallet not connected');
      return;
    }

    setStatus('pending');
    setErrorMessage('');

    try {
      // Final validation before sending
      if (!isValidEthereumAddress(form.address)) {
        throw new Error('Invalid recipient address');
      }

      if (!isValidAmountFormat(form.amount)) {
        throw new Error('Invalid amount format');
      }

      // Format amount according to token decimals
      const formattedAmount = formatAmount(form.amount, selectedTokenState.decimals);

      const result = await sendTransaction({
        from: wallet.address,
        to: form.address,
        amount: formattedAmount,
        token: {
          symbol: selectedTokenState.symbol,
          address: selectedTokenState.address,
          decimals: selectedTokenState.decimals,
          isNative: selectedTokenState.isNative
        },
        chain,
        seedPhrase: wallet.seedPhrase,
        privateKey: wallet.privateKey
      });

      if (result.success) {
        setStatus('success');
        onClose();
        setForm({ address: '', amount: '' });
        toast.success('Transaction sent successfully!');
      } else {
        throw new Error(result.error || 'Failed to send transaction');
      }
    } catch (error: any) {
      console.error('Send error:', error);
      setStatus('error');
      setErrorMessage(error.message || 'Failed to send transaction');
      toast.error(error.message || 'Failed to send transaction');
    }
  };

  // Render different states
  if (status === 'pending') {
    return (
      <BaseModal isOpen={isOpen} onClose={onClose} title="Sending">
        <div className="text-center py-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500 mx-auto mb-2"></div>
          <p>Processing transaction...</p>
        </div>
      </BaseModal>
    );
  }

  if (status === 'error') {
    return (
      <BaseModal isOpen={isOpen} onClose={onClose} title="Error">
        <div className="text-center">
          <p className="text-red-500 mb-4">{errorMessage}</p>
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
            {availableTokens.map(token => (
              <option key={token.symbol} value={token.symbol}>
                {token.name} ({formatBalance(token.balance)} {token.symbol})
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
          {validationErrors.address && (
            <p className="text-red-500 text-xs mt-1">{validationErrors.address}</p>
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
            />
            <button
              onClick={handleMax}
              className="btn-secondary px-3"
            >
              MAX
            </button>
          </div>
          {validationErrors.amount ? (
            <p className="text-red-500 text-xs mt-1">{validationErrors.amount}</p>
          ) : (
            <p className="text-xs text-gray-400 mt-1">
              Available: {formatBalance(selectedTokenState.balance)} {selectedTokenState.symbol}
            </p>
          )}
        </div>

        {/* Network Fee */}
        {selectedTokenState.isNative && (
          <div className="text-xs text-gray-400">
            {feeLoading ? (
              <p>Calculating network fee...</p>
            ) : feeError ? (
              <p>Failed to estimate network fee</p>
            ) : (
              <div className="flex justify-between">
                <span>Estimated Fee:</span>
                <span>
                  {estimatedFee} {selectedTokenState.symbol} (${feeUSD})
                </span>
              </div>
            )}
          </div>
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
              <span>Processing...</span>
            </div>
          ) : (
            `Send ${selectedTokenState.symbol}`
          )}
        </button>
      </div>
    </BaseModal>
  );
} 