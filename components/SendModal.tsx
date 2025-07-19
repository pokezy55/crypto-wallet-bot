import { useState, useEffect, useCallback, useMemo } from 'react';
import { BaseModal } from './BaseModal';
import { getProvider, getSigner, getTokenList } from '@/lib/chain';
import { isValidEthereumAddress, isValidAmountFormat, formatAmount } from '@/lib/validation';
import { useSendTransaction } from '@/hooks/useSendTransaction';
import { useGasFee } from '@/hooks/useGasFee';
import toast from 'react-hot-toast';

interface SendModalProps {
  isOpen: boolean;
  onClose: () => void;
  seedPhrase?: string;
  privateKey?: string;
  chain?: string;
}

interface TokenState {
  symbol: string;
  balance: string;
  decimals: number;
  isNative: boolean;
  address?: string;
}

export function SendModal({ isOpen, onClose, seedPhrase, privateKey, chain = 'eth' }: SendModalProps) {
  const [form, setForm] = useState({ to: '', amount: '' });
  const [selectedTokenState, setSelectedTokenState] = useState<TokenState>({
    symbol: 'ETH',
    balance: '0',
    decimals: 18,
    isNative: true
  });
  const [status, setStatus] = useState<'idle' | 'pending' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [nativeBalance, setNativeBalance] = useState<string>('0');
  const [tokenPrices, setTokenPrices] = useState<Record<string, number>>({});

  // Use hooks
  const { sendTransaction, loading: txLoading } = useSendTransaction();
  const { fee: estimatedFee, feeUSD, loading: feeLoading, error: feeError } = useGasFee(
    chain,
    selectedTokenState.isNative
  );

  // Fetch native balance and token prices
  useEffect(() => {
    const fetchBalances = async () => {
      try {
        const provider = getProvider(chain);
        const signer = await getSigner(chain, seedPhrase, privateKey);
        const address = await signer.getAddress();
        const balance = await provider.getBalance(address);
        setNativeBalance(balance.toString());
        
        // Update selected token balance if it's native
        if (selectedTokenState.isNative) {
          setSelectedTokenState(prev => ({
            ...prev,
            balance: balance.toString()
          }));
        }
      } catch (error) {
        console.error('Error fetching native balance:', error);
      }
    };

    const fetchPrices = async () => {
      try {
        const response = await fetch('/api/price');
        const prices = await response.json();
        setTokenPrices(prices);
      } catch (error) {
        console.error('Error fetching token prices:', error);
      }
    };

    if (isOpen) {
      fetchBalances();
      fetchPrices();
    }
  }, [isOpen, chain, seedPhrase, privateKey, selectedTokenState.isNative]);

  // Format USD amount
  const formatUSD = useCallback((amount: number) => {
    if (isNaN(amount) || amount === 0) return '$0.00';
    if (amount < 0.0001) return '< $0.0001';
    return `$${amount.toFixed(4)}`;
  }, []);

  // Format estimated fee display
  const formattedFee = useMemo(() => {
    if (feeError || !estimatedFee) return 'Calculating...';
    if (feeLoading) return 'Calculating...';
    
    const feeValue = typeof feeUSD === 'string' ? parseFloat(feeUSD) : (feeUSD || 0);
    return `${estimatedFee} ETH (${formatUSD(feeValue)})`;
  }, [estimatedFee, feeError, feeLoading, feeUSD, formatUSD]);

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
          formattedAmount = maxAmount.toFixed(selectedTokenState.decimals).replace(/\.?0+$/, '') || '0';
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
          formattedAmount = balance.toFixed(selectedTokenState.decimals).replace(/\.?0+$/, '') || '0';
        }
        
        setForm(prev => ({ ...prev, amount: formattedAmount }));
      } catch (error) {
        console.error('Error setting max amount:', error);
        toast.error('Failed to set maximum amount');
      }
    }
  };

  // Handle form submission
  const handleSubmit = async () => {
    try {
      setStatus('pending');
      setErrorMessage('');

      // Validate form
      if (!form.to || !form.amount) {
        throw new Error('Please fill in all fields');
      }

      if (!isValidEthereumAddress(form.to)) {
        throw new Error('Invalid recipient address');
      }

      if (!isValidAmountFormat(form.amount)) {
        throw new Error('Invalid amount format');
      }

      // Get current balance and convert to same decimal places
      const balance = parseFloat(selectedTokenState.balance?.toString() || '0');
      const amount = parseFloat(form.amount);

      if (isNaN(balance) || isNaN(amount)) {
        throw new Error('Invalid amount or balance');
      }

      // For native token, ensure we have enough for amount + gas
      if (selectedTokenState.isNative) {
        const fee = feeError ? 0 : parseFloat(estimatedFee || '0');
        if (amount + fee > balance) {
          throw new Error(`Insufficient ${selectedTokenState.symbol} balance (including gas fee)`);
        }
      } else {
        // For tokens, check token balance and ETH for gas separately
        if (amount > balance) {
          throw new Error(`Insufficient ${selectedTokenState.symbol} balance`);
        }

        // Check if we have enough ETH for gas
        const fee = feeError ? 0 : parseFloat(estimatedFee || '0');
        const ethBalance = parseFloat(nativeBalance || '0');
        
        if (fee > ethBalance) {
          throw new Error('Insufficient ETH for gas fee');
        }
      }

      // Send transaction
      const result = await sendTransaction({
        from: await getSigner(chain, seedPhrase, privateKey).then(s => s.getAddress()),
        to: form.to,
        amount: form.amount,
        token: selectedTokenState,
        chain,
        seedPhrase,
        privateKey
      });

      if (!result.success) {
        throw new Error(result.error || 'Transaction failed');
      }

      setStatus('success');
      onClose();
    } catch (error: any) {
      console.error('Send error:', error);
      setStatus('error');
      setErrorMessage(error.message);
      toast.error(error.message);
    }
  };

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setForm({ to: '', amount: '' });
      setStatus('idle');
      setErrorMessage('');
    }
  }, [isOpen]);

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title="Send"
      onAction={handleSubmit}
      isLoading={status === 'pending' || txLoading || feeLoading}
      error={errorMessage}
    >
      {/* Modal content */}
      <div className="space-y-4">
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            To Address
          </label>
          <input
            type="text"
            value={form.to}
            onChange={(e) => setForm(prev => ({ ...prev, to: e.target.value }))}
            placeholder="0x..."
            className="w-full px-3 py-2 border rounded-md"
          />
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Amount
          </label>
          <div className="relative">
            <input
              type="text"
              value={form.amount}
              onChange={(e) => handleAmountChange(e.target.value)}
              placeholder="0.0"
              className="w-full px-3 py-2 border rounded-md"
            />
            <button
              onClick={handleMax}
              className="absolute right-2 top-2 text-sm text-blue-600 hover:text-blue-800"
            >
              MAX
            </button>
          </div>
          <div className="text-xs text-gray-500">
            Available: {parseFloat(selectedTokenState.balance).toFixed(6)} {selectedTokenState.symbol}
          </div>
        </div>

        <div className="text-sm text-gray-600">
          Estimated Fee: {formattedFee}
        </div>
      </div>
    </BaseModal>
  );
} 