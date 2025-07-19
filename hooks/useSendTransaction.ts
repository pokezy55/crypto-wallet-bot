import { useState, useCallback } from 'react';
import { Wallet, JsonRpcProvider, Contract, parseUnits, formatUnits, isAddress, BrowserProvider } from 'ethers';
import { getProvider } from '@/lib/chain';
import toast from 'react-hot-toast';
import { TransactionToast } from '@/components/TransactionToast';

const ERC20_ABI = [
  'function transfer(address to, uint256 amount) returns (bool)',
  'function balanceOf(address) view returns (uint256)',
  'function decimals() view returns (uint8)'
];

interface SendTransactionParams {
  from: string;
  to: string;
  amount: string;
  token: {
    symbol: string;
    address?: string;
    decimals: number;
    isNative: boolean;
  };
  chain: string;
  seedPhrase: string;
}

interface TransactionResult {
  success: boolean;
  txHash?: string;
  error?: string;
}

export function useSendTransaction() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Helper function to validate and format amount
  const validateAndFormatAmount = (amount: string): string => {
    // Remove any commas and spaces
    const cleanAmount = amount.replace(/,/g, '').trim();
    
    // Check if it's a valid number
    if (!/^\d*\.?\d*$/.test(cleanAmount)) {
      throw new Error('Invalid amount format');
    }

    // Parse as float and check range
    const value = parseFloat(cleanAmount);
    if (isNaN(value) || value <= 0) {
      throw new Error('Amount must be greater than 0');
    }

    // Convert scientific notation to fixed notation
    if (cleanAmount.includes('e')) {
      return value.toFixed(18);
    }

    return cleanAmount;
  };

  const sendTransaction = useCallback(async ({
    from,
    to,
    amount,
    token,
    chain,
    seedPhrase
  }: SendTransactionParams): Promise<TransactionResult> => {
    setLoading(true);
    setError(null);

    try {
      // Validate addresses
      if (!isAddress(from) || !isAddress(to)) {
        throw new Error('Invalid address format');
      }

      // Validate and format amount
      let formattedAmount: string;
      try {
        formattedAmount = validateAndFormatAmount(amount);
      } catch (error: any) {
        throw new Error(`Invalid amount: ${error.message}`);
      }

      // Get provider and create wallet
      const provider = getProvider(chain) as unknown as BrowserProvider;
      const wallet = new Wallet(seedPhrase).connect(provider);

      // Verify wallet address matches sender
      if (wallet.address.toLowerCase() !== from.toLowerCase()) {
        throw new Error('Invalid wallet for sender address');
      }

      let tx;
      if (token.isNative) {
        // Send native token
        try {
          const valueInWei = parseUnits(formattedAmount, token.decimals);
          
          // Check native balance
          const balance = await provider.getBalance(from);
          if (balance < valueInWei) {
            throw new Error(`Insufficient ${token.symbol} balance`);
          }

          tx = await wallet.sendTransaction({
            to,
            value: valueInWei
          });
        } catch (error: any) {
          if (error.message.includes('insufficient funds')) {
            throw new Error(`Insufficient ${token.symbol} balance for transaction`);
          }
          if (error.message.includes('invalid BigNumber')) {
            throw new Error('Invalid amount format');
          }
          throw error;
        }
      } else {
        // Send ERC-20 token
        if (!token.address || !isAddress(token.address)) {
          throw new Error(`Invalid contract address for ${token.symbol}`);
        }

        try {
          const tokenContract = new Contract(token.address, ERC20_ABI, wallet);
          const amountInWei = parseUnits(formattedAmount, token.decimals);

          // Check token balance
          const balance = await tokenContract.balanceOf(from);
          if (balance < amountInWei) {
            throw new Error(`Insufficient ${token.symbol} balance`);
          }

          tx = await tokenContract.transfer(to, amountInWei);
        } catch (error: any) {
          if (error.message.includes('insufficient funds')) {
            throw new Error('Insufficient gas fee balance');
          }
          if (error.message.includes('invalid BigNumber')) {
            throw new Error('Invalid amount format');
          }
          throw error;
        }
      }

      // Wait for transaction confirmation
      const receipt = await tx.wait();
      
      // Show success toast
      toast.success('Transaction sent!', {
        duration: 5000,
        icon: '✅'
      });

      // Update transaction history in background
      try {
        await fetch('/api/transaction/history', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            txHash: receipt.hash,
            from,
            to,
            token: token.symbol,
            amount: formattedAmount,
            chain
          })
        });
      } catch (error) {
        console.warn('Failed to update transaction history:', error);
      }

      return {
        success: true,
        txHash: receipt.hash
      };

    } catch (error: any) {
      console.error('Transaction error:', error);
      const errorMessage = error.message || 'Transaction failed';
      setError(errorMessage);
      toast.error(errorMessage);
      return {
        success: false,
        error: errorMessage
      };
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    sendTransaction,
    loading,
    error
  };
} 