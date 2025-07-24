import { useState, useCallback } from 'react';
import { Contract, parseUnits, ethers } from 'ethers';
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
  seedPhrase?: string;
  privateKey?: string;
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
    chain,
    seedPhrase,
    privateKey
  }: SendTransactionParams): Promise<TransactionResult> => {
    setLoading(true);
    setError(null);

    try {
      // Get signer
      let signer;
      try {
        signer = await getSigner(chain, seedPhrase, privateKey);
      } catch (error: any) {
        console.error('Failed to get signer:', error);
        throw new Error(error.message || 'Failed to get signer');
      }

      if (!signer) {
        throw new Error('Please connect your wallet or import your account to send transactions');
      }

      // Verify signer address matches sender
      let signerAddress;
      try {
        signerAddress = await signer.getAddress();
      } catch (error: any) {
        console.error('Failed to get signer address:', error);
        throw new Error('Please connect your wallet or import your account to send transactions');
      }

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

        let checksumAddress: string;
        try {
          checksumAddress = ethers.getAddress(token.address);
        } catch (err) {
          console.warn('Invalid token address:', token.address, err);
          return { error: 'Invalid token address' } as TransactionResult;
        }

        try {
          // Create contract with provider first
          const provider = getProvider(chain);
          const tokenContract = new Contract(checksumAddress, ERC20_ABI, provider);
          
          // Parse amount to wei using token decimals
          const amountInWei = parseUnits(amount, token.decimals);

          // Check token balance
          const balance = await tokenContract.balanceOf(from);
          if (balance < amountInWei) {
            throw new Error(`Insufficient ${token.symbol} balance`);
          }

          // Send transaction
          const data = tokenContract.interface.encodeFunctionData('transfer', [to, amountInWei]);
          tx = await signer.sendTransaction({
            to: checksumAddress,
            data
          });
        } catch (err) {
          console.warn('Invalid token address:', token.address, err);
          // handle error or skip
        }
      }

      if (!tx) return { error: 'Transaction failed' } as TransactionResult;

      // Wait for transaction confirmation
      const receipt = await tx.wait();
      if (!receipt) {
        throw new Error('Transaction failed: no receipt received');
      }
      
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