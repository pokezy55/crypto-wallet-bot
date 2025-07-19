import { useState, useEffect } from 'react';
import { formatUnits, parseUnits } from 'ethers';
import { getProvider } from '@/lib/chain';

interface GasFeeEstimate {
  fee: string;
  loading: boolean;
  error: string | null;
}

const DEFAULT_GAS_PRICE = BigInt('20000000000'); // 20 Gwei

export function useGasFee(chain: string, isNative: boolean = true) {
  const [estimate, setEstimate] = useState<GasFeeEstimate>({
    fee: '0',
    loading: true,
    error: null
  });

  useEffect(() => {
    let mounted = true;

    const fetchGasPrice = async () => {
      if (!chain) return;

      try {
        const provider = getProvider(chain);
        
        // Get current gas price
        const feeData = await provider.getFeeData();
        
        if (!mounted) return;

        // Use gasPrice if available, otherwise use default
        const currentGasPrice = feeData.gasPrice || DEFAULT_GAS_PRICE;

        if (isNative) {
          // For native token transfers, use 21000 gas
          const gasFee = currentGasPrice * BigInt(21000);
          setEstimate({
            fee: formatUnits(gasFee, 18), // Native tokens use 18 decimals
            loading: false,
            error: null
          });
        } else {
          // For ERC20 transfers, use ~65000 gas (approximate)
          const gasFee = currentGasPrice * BigInt(65000);
          setEstimate({
            fee: formatUnits(gasFee, 18),
            loading: false,
            error: null
          });
        }
      } catch (error) {
        console.error('Error fetching gas price:', error);
        if (mounted) {
          setEstimate(prev => ({
            ...prev,
            loading: false,
            error: 'Failed to fetch gas price'
          }));
        }
      }
    };

    // Initial fetch
    fetchGasPrice();

    // Fetch every 10 seconds
    const interval = setInterval(fetchGasPrice, 10000);

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [chain, isNative]);

  return estimate;
} 