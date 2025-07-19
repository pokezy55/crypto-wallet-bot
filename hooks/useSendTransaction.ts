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

// Debug logging function
const debugLog = (stage: string, data: any) => {
  console.group(`🔍 Debug [${stage}]`);
  console.log(JSON.stringify(data, null, 2));
  console.groupEnd();
};

// Check if string might be a mnemonic
const isMnemonicLike = (str: string): boolean => {
  const words = str.trim().split(/\s+/);
  return words.length >= 12 && words.length <= 24;
};

export function useSendTransaction() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Helper function to validate and format amount
  const validateAndFormatAmount = (amount: string): string => {
    debugLog('Amount Validation Input', { amount });

    try {
      // Remove any commas, spaces, and leading zeros
      let cleanAmount = amount.replace(/[,\s]/g, '');
      
      // Check for potential mnemonic
      if (isMnemonicLike(amount)) {
        throw new Error('Invalid input: Looks like a seed phrase');
      }

      // Handle leading zeros and decimal points
      if (cleanAmount.startsWith('.')) {
        cleanAmount = '0' + cleanAmount;
      }
      
      // Check if it's a valid decimal number
      if (!/^\d*\.?\d*$/.test(cleanAmount)) {
        throw new Error('Invalid amount format');
      }

      // Parse as float and check range
      const value = parseFloat(cleanAmount);
      if (isNaN(value) || value <= 0) {
        throw new Error('Amount must be greater than 0');
      }

      debugLog('Amount Validation Result', { cleanAmount });
      return cleanAmount;
    } catch (error: any) {
      console.error('Amount validation error:', error);
      throw new Error(error.message || 'Invalid amount format');
    }
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

    // Initial debug log
    debugLog('Transaction Params', {
      from,
      to,
      amount,
      token: { ...token, seedPhrase: '***' }, // Hide sensitive data
      chain
    });

    try {
      // Validate addresses
      if (!isAddress(from)) {
        throw new Error('Invalid sender address');
      }
      if (!isAddress(to)) {
        throw new Error('Invalid recipient address');
      }
      if (isMnemonicLike(to)) {
        throw new Error('Recipient looks like a seed phrase');
      }

      debugLog('Address Validation', {
        from: isAddress(from),
        to: isAddress(to)
      });

      // Get provider and create wallet
      const provider = getProvider(chain) as unknown as BrowserProvider;
      const wallet = new Wallet(seedPhrase).connect(provider);

      // Verify wallet address matches sender
      if (wallet.address.toLowerCase() !== from.toLowerCase()) {
        throw new Error('Invalid wallet for sender address');
      }

      // Validate amount format first
      const validatedAmount = validateAndFormatAmount(amount);

      let tx;
      if (token.isNative) {
        // Send native token
        try {
          // Parse amount to wei (always 18 decimals for native tokens)
          const valueInWei = parseUnits(validatedAmount, 18);
          
          debugLog('Native Token Transaction', {
            to,
            valueInWei: valueInWei.toString(),
            chain,
            decimals: 18
          });

          // Check native balance
          const balance = await provider.getBalance(from);
          if (balance < valueInWei) {
            throw new Error(`Insufficient ${token.symbol} balance`);
          }

          // Final validation before sending
          if (!isAddress(to) || isMnemonicLike(validatedAmount)) {
            throw new Error('Invalid transaction parameters');
          }

          tx = await wallet.sendTransaction({
            to,
            value: valueInWei
          });
        } catch (error: any) {
          console.error('Native token transfer error:', error);
          if (error.message.includes('insufficient funds')) {
            throw new Error(`Insufficient ${token.symbol} balance for transaction`);
          }
          if (error.code === 'INVALID_ARGUMENT') {
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
          
          // Parse amount to wei using token decimals
          const amountInWei = parseUnits(validatedAmount, token.decimals);

          debugLog('ERC20 Token Transaction', {
            to,
            tokenAddress: token.address,
            amountInWei: amountInWei.toString(),
            decimals: token.decimals
          });

          // Check token balance
          const balance = await tokenContract.balanceOf(from);
          if (balance < amountInWei) {
            throw new Error(`Insufficient ${token.symbol} balance`);
          }

          // Final validation before sending
          if (!isAddress(to) || isMnemonicLike(validatedAmount)) {
            throw new Error('Invalid transaction parameters');
          }

          tx = await tokenContract.transfer(to, amountInWei);
        } catch (error: any) {
          console.error('ERC20 token transfer error:', error);
          if (error.message.includes('insufficient funds')) {
            throw new Error('Insufficient gas fee balance');
          }
          if (error.code === 'INVALID_ARGUMENT') {
            throw new Error('Invalid amount format');
          }
          throw error;
        }
      }

      // Wait for transaction confirmation
      const receipt = await tx.wait();
      
      debugLog('Transaction Success', {
        hash: receipt.hash,
        from,
        to,
        amount: validatedAmount
      });

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
            amount: validatedAmount,
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
      debugLog('Transaction Error', {
        message: error.message,
        code: error.code,
        data: error.data
      });

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