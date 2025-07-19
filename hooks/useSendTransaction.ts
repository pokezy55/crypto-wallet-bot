import { useCallback } from 'react';
import { Contract, parseUnits, formatUnits, ZeroAddress } from 'ethers';
import { toast } from 'react-hot-toast';
import { getProvider, getSigner } from '../lib/chain';

const ERC20_ABI = [
  'function transfer(address to, uint256 amount) returns (bool)',
  'function balanceOf(address) view returns (uint256)'
];

interface SendTransactionParams {
  from: string;
  to: string;
  amount: string;
  token?: {
    address: string;
    decimals: number;
    isNative: boolean;
  };
  chain: string;
  seedPhrase?: string;
  privateKey?: string;
}

export function useSendTransaction() {
  const sendTransaction = useCallback(async ({
    to,
    amount,
    token,
    chain,
    seedPhrase,
    privateKey
  }: SendTransactionParams) => {
    try {
      // Get provider and signer
      const provider = getProvider(chain);
      const signer = await getSigner(chain, seedPhrase, privateKey);
      
      // Get real-time balance before sending
      const address = await signer.getAddress();
      let currentBalance: bigint;
      
      if (token?.isNative) {
        currentBalance = await provider.getBalance(address);
      } else if (token?.address) {
        const tokenContract = new Contract(
          token.address,
          ERC20_ABI,
          provider
        );
        currentBalance = await tokenContract.balanceOf(address);
      } else {
        throw new Error('Invalid token configuration');
      }

      // Convert amount to Wei/smallest unit
      const amountInWei = parseUnits(amount, token?.decimals || 18);
      
      // For native token transfers, estimate gas and check total required amount
      if (token?.isNative) {
        const feeData = await provider.getFeeData();
        const gasLimit = await provider.estimateGas({
          from: address,
          to,
          value: amountInWei
        });
        
        // Handle gas cost calculation safely using BigInt
        const gasPriceValue = feeData.gasPrice || BigInt(0);
        const gasCostBigInt = BigInt(gasLimit) * gasPriceValue;
        const totalRequired = amountInWei + gasCostBigInt;

        if (totalRequired > currentBalance) {
          const available = formatUnits(currentBalance, token.decimals);
          const required = formatUnits(totalRequired, token.decimals);
          throw new Error(
            `Insufficient balance on ${chain}. Available: ${available} ETH, Required (including gas): ${required} ETH`
          );
        }
      } else {
        // For token transfers, just check token balance
        if (amountInWei > currentBalance) {
          const available = formatUnits(currentBalance, token?.decimals || 18);
          const required = amount;
          throw new Error(
            `Insufficient token balance on ${chain}. Available: ${available}, Required: ${required}`
          );
        }
      }

      // Send transaction
      if (token?.isNative) {
        const tx = await signer.sendTransaction({
          to: to || ZeroAddress,
          value: amountInWei
        });
        await tx.wait();
        return tx;
      } else if (token?.address) {
        // Create contract instance with signer
        const tokenContract = new Contract(
          token.address,
          ERC20_ABI,
          provider
        ).connect(signer);
        
        const tx = await tokenContract.transfer(to, amountInWei);
        await tx.wait();
        return tx;
      } else {
        throw new Error('Invalid token configuration');
      }
    } catch (error: any) {
      console.error('Transaction error:', error);
      
      // Handle specific error cases
      if (error.message.includes('insufficient funds')) {
        throw new Error('Insufficient balance for transaction');
      } else if (error.message.includes('user rejected')) {
        throw new Error('Transaction was rejected');
      } else if (error.message.includes('gas required exceeds')) {
        throw new Error('Transaction would fail - gas estimation failed');
      }
      
      throw error;
    }
  }, []);

  return { sendTransaction };
} 