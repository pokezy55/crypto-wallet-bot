import { useState, useCallback, useEffect } from 'react';
import { parseUnits, formatUnits } from 'ethers';
import { BaseModal } from './ActionModal';
import { getTokenList } from '@/lib/chain';
import { useSendTransaction } from '@/hooks/useSendTransaction';
import { useGasFee } from '@/hooks/useGasFee';
import { isValidEthereumAddress, isValidAmountFormat, formatAmount, isSensitiveData } from '@/lib/validation';
import toast from 'react-hot-toast';
import { getProvider, getSigner } from '../lib/chain';

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
    return num.toExponential(6);
  }
  return num.toFixed(decimals).replace(/\.?0+$/, '') || '0';
}

// Format balance helper with chain name
function formatBalanceWithSymbol(balance: string | number | undefined, decimals: number = 6, symbol: string = ''): string {
  if (balance === undefined || balance === null) {
    return '0';
  }
  const num = typeof balance === 'string' ? parseFloat(balance) : balance;
  if (isNaN(num)) {
    return '0';
  }
  // Handle small numbers better
  if (num < 0.000001) {
    return `${num.toExponential(6)} ${symbol}`.trim();
  }
  return `${num.toFixed(decimals).replace(/\.?0+$/, '') || '0'} ${symbol}`.trim();
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
  selectedToken: Token;
  chain: string;
  seedPhrase?: string;
  privateKey?: string;
}

export function SendModal({ isOpen, onClose, selectedToken, chain, seedPhrase, privateKey }: SendModalProps) {
  // Early validation of required props
  if (!isOpen || !seedPhrase || !privateKey) {
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

  // Add new state for real-time balance
  const [realTimeBalance, setRealTimeBalance] = useState<string>('0');
  
  // Function to fetch real-time balance
  const fetchRealTimeBalance = useCallback(async () => {
    try {
      const provider = getProvider(chain);
      const signer = await getSigner(chain, seedPhrase, privateKey);
      const address = await signer.getAddress();
      
      if (selectedTokenState.isNative) {
        const balance = await provider.getBalance(address);
        setRealTimeBalance(formatUnits(balance, selectedTokenState.decimals));
      } else {
        // For ERC20 tokens - implement if needed
        const balance = await provider.getBalance(address);
        setRealTimeBalance(formatUnits(balance, selectedTokenState.decimals));
      }
    } catch (error) {
      console.error('Error fetching real-time balance:', error);
      toast.error('Failed to fetch current balance');
    }
  }, [chain, selectedTokenState, seedPhrase, privateKey]);

  // Fetch real-time balance on mount and when token changes
  useEffect(() => {
    if (isOpen) {
      fetchRealTimeBalance();
    }
  }, [isOpen, selectedTokenState, fetchRealTimeBalance]);

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

  // Validate transaction before sending
  const validateTransaction = useCallback(async () => {
    try {
      if (!form.amount || !form.address) {
        return false;
      }

      // Validate address
      if (!isValidEthereumAddress(form.address)) {
        toast.error('Invalid recipient address');
        return false;
      }

      // Get real-time balance and gas estimate
      await fetchRealTimeBalance();
      
      const amountInWei = parseUnits(formatAmount(form.amount, selectedTokenState.decimals), selectedTokenState.decimals);
      const balanceInWei = parseUnits(realTimeBalance, selectedTokenState.decimals);
      
      // For native token transfers, include gas fee in calculation
      if (selectedTokenState.isNative) {
        const gasFee = feeError ? '0' : (estimatedFee || '0');
        const gasFeeInWei = parseUnits(gasFee, selectedTokenState.decimals);
        const totalRequired = amountInWei + gasFeeInWei;

        if (totalRequired > balanceInWei) {
          const available = formatBalanceWithSymbol(realTimeBalance, 6, selectedTokenState.symbol);
          const required = formatBalanceWithSymbol(
            formatUnits(totalRequired, selectedTokenState.decimals),
            6,
            selectedTokenState.symbol
          );
          
          toast.error(
            `Insufficient balance on ${chain}. Available: ${available}, Required (including gas): ${required}`
          );
          return false;
        }
      } else {
        // For token transfers, just check token balance
        if (amountInWei > balanceInWei) {
          const available = formatBalanceWithSymbol(realTimeBalance, 6, selectedTokenState.symbol);
          const required = formatBalanceWithSymbol(form.amount, 6, selectedTokenState.symbol);
          
          toast.error(
            `Insufficient ${selectedTokenState.symbol} balance on ${chain}. Available: ${available}, Required: ${required}`
          );
          return false;
        }
      }

      return true;
    } catch (error) {
      console.error('Transaction validation error:', error);
      toast.error('Failed to validate transaction');
      return false;
    }
  }, [form, selectedTokenState, chain, realTimeBalance, estimatedFee, feeError]);

  // Check if form is valid
  const isFormValid = !validationErrors.address && 
                     !validationErrors.amount && 
                     form.address && 
                     form.amount;

  // Handle amount change
  const handleAmountChange = (value: string) => {
    // Allow numbers, one decimal point, and scientific notation
    if (value === '' || /^[0-9]*\.?[0-9]*(?:[eE]-?[0-9]+)?$/.test(value)) {
      let formattedValue = value;
      
      // Convert scientific notation to decimal if needed
      if (value.includes('e')) {
        const num = parseFloat(value);
        if (!isNaN(num)) {
          formattedValue = num.toString();
        }
      }

      setForm(prev => ({ ...prev, amount: formattedValue }));
    }
  };

  // Handle max amount
  const handleMax = () => {
    if (selectedTokenState.isNative) {
      try {
        // For native tokens, subtract estimated fee
        const fee = feeError ? 0 : parseFloat(estimatedFee || '0');
        const balance = parseFloat(selectedTokenState.balance?.toString() || '0');
        const maxAmount = Math.max(0, balance - fee);
        
        // Format the amount based on size
        let formattedAmount;
        if (maxAmount < 0.000001) {
          formattedAmount = maxAmount.toExponential(6);
        } else {
          formattedAmount = formatBalance(maxAmount, selectedTokenState.decimals);
        }
        
        setForm(prev => ({ ...prev, amount: formattedAmount }));
      } catch (error) {
        console.error('Error calculating max amount:', error);
        toast.error('Failed to calculate maximum amount');
      }
    } else {
      try {
        const balance = parseFloat(selectedTokenState.balance?.toString() || '0');
        
        // Format the amount based on size
        let formattedAmount;
        if (balance < 0.000001) {
          formattedAmount = balance.toExponential(6);
        } else {
          formattedAmount = formatBalance(balance, selectedTokenState.decimals);
        }
        
        setForm(prev => ({ ...prev, amount: formattedAmount }));
      } catch (error) {
        console.error('Error setting max amount:', error);
        toast.error('Failed to set maximum amount');
      }
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
    setStatus('pending');
    setErrorMessage('');

    try {
      const isValid = await validateTransaction();
      if (!isValid) {
        setStatus('error');
        setErrorMessage('Transaction validation failed.');
        toast.error('Transaction validation failed.');
        return;
      }

      // Format amount according to token decimals
      const formattedAmount = formatAmount(form.amount, selectedTokenState.decimals);

      const result = await sendTransaction({
        from: seedPhrase, // Assuming seedPhrase is the signer's address
        to: form.address,
        amount: formattedAmount,
        token: {
          symbol: selectedTokenState.symbol,
          address: selectedTokenState.address,
          decimals: selectedTokenState.decimals,
          isNative: selectedTokenState.isNative
        },
        chain,
        seedPhrase: seedPhrase,
        privateKey: privateKey
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
              Available: {formatBalanceWithSymbol(realTimeBalance, 6, selectedTokenState.symbol)}
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