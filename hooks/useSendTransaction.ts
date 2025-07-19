import { useState, useCallback } from 'react';
import { Contract, parseUnits } from 'ethers';
import { getProvider, getSigner } from '@/lib/chain';
import toast from 'react-hot-toast';

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
}

interface TransactionResult {
  success: boolean;
  txHash?: string;
  error?: string;
}

export function useSendTransaction() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sendTransaction = useCallback(async ({
    from,
    to,
    amount,
    token,
    chain
  }: SendTransactionParams): Promise<TransactionResult> => {
    setLoading(true);
    setError(null);

    try {
      // Get signer
      const signer = await getSigner(chain);
      if (!signer) {
        throw new Error('Failed to get signer');
      }

      // Verify signer address matches sender
      const signerAddress = await signer.getAddress();
      if (signerAddress.toLowerCase() !== from.toLowerCase()) {
        throw new Error('Signer address does not match sender');
      }

      let tx;
      if (token.isNative) {
        // Send native token
        try {
          // Parse amount to wei (always 18 decimals for native tokens)
          const valueInWei = parseUnits(amount, 18);
          
          // Check native balance
          if (!signer.provider) {
            throw new Error('Provider not available');
          }
          const balance = await signer.provider.getBalance(from);
          if (balance < valueInWei) {
            throw new Error(`Insufficient ${token.symbol} balance`);
          }

          tx = await signer.sendTransaction({
            to,
            value: valueInWei
          });
        } catch (error: any) {
          console.error('Native token transfer error:', error);
          if (error.message.includes('insufficient funds')) {
            throw new Error(`Insufficient ${token.symbol} balance for transaction`);
          }
          throw error;
        }
      } else {
        // Send ERC-20 token
        if (!token.address) {
          throw new Error(`Invalid contract address for ${token.symbol}`);
        }

        try {
          const tokenContract = new Contract(token.address, ERC20_ABI, signer);
          
          // Parse amount to wei using token decimals
          const amountInWei = parseUnits(amount, token.decimals);

          // Check token balance
          const balance = await tokenContract.balanceOf(from);
          if (balance < amountInWei) {
            throw new Error(`Insufficient ${token.symbol} balance`);
          }

          tx = await tokenContract.transfer(to, amountInWei);
        } catch (error: any) {
          console.error('ERC20 token transfer error:', error);
          if (error.message.includes('insufficient funds')) {
            throw new Error('Insufficient gas fee balance');
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