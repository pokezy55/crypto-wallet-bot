import { useState, useEffect } from 'react';
import { formatUnits, parseUnits } from 'ethers';
import { getProvider } from '@/lib/chain';
import { useTokenPrices } from './useTokenPrices';

interface GasFeeEstimate {
  fee: string;
  feeUSD: string;
  loading: boolean;
  error: string | null;
}

// Gas limit constants
const GAS_LIMIT = {
  NATIVE_TRANSFER: BigInt(21000),
  ERC20_TRANSFER: BigInt(65000)
};

// Default gas price in Gwei per chain
const DEFAULT_GAS_PRICE = {
  eth: BigInt(30), // 30 Gwei
  bsc: BigInt(5),  // 5 Gwei
  polygon: BigInt(50), // 50 Gwei
  base: BigInt(1)  // 1 Gwei
};

// Native token symbols per chain
const NATIVE_SYMBOLS = {
  eth: 'ETH',
  bsc: 'BNB',
  polygon: 'MATIC',
  base: 'ETH'
};

export function useGasFee(chain: string, isNative: boolean = true) {
  const [estimate, setEstimate] = useState<GasFeeEstimate>({
    fee: '0',
    feeUSD: '0.00',
    loading: true,
    error: null
  });

  // Get token prices
  const tokenPrices = useTokenPrices();

  useEffect(() => {
    let mounted = true;
    let pollInterval: NodeJS.Timeout;

    const fetchGasPrice = async () => {
      if (!chain) return;

      try {
        const provider = getProvider(chain);
        
        // Get current gas price
        const feeData = await provider.getFeeData();
        
        if (!mounted) return;

        // Use appropriate gas price or fallback to default
        let gasPrice = BigInt(0);
        
        if (feeData.gasPrice) {
          gasPrice = feeData.gasPrice;
        } else {
          // Convert Gwei to Wei (multiply by 10^9)
          const defaultGweiPrice = DEFAULT_GAS_PRICE[chain as keyof typeof DEFAULT_GAS_PRICE] || BigInt(5);
          gasPrice = defaultGweiPrice * BigInt(1000000000);
        }

        // Calculate total gas fee
        const gasLimit = isNative ? GAS_LIMIT.NATIVE_TRANSFER : GAS_LIMIT.ERC20_TRANSFER;
        const totalFee = gasPrice * gasLimit;

        // Format fee to native token decimals (18)
        const formattedFee = formatUnits(totalFee, 18);

        // Calculate USD value
        const nativeSymbol = NATIVE_SYMBOLS[chain as keyof typeof NATIVE_SYMBOLS] || 'ETH';
        const tokenPrice = tokenPrices[nativeSymbol]?.priceUSD || 0;
        const feeUSD = (parseFloat(formattedFee) * tokenPrice).toFixed(4);

        if (mounted) {
          setEstimate({
            fee: formattedFee,
            feeUSD,
            loading: false,
            error: null
          });
        }
      } catch (error) {
        console.error('Error fetching gas price:', error);
        if (mounted) {
          // Use default gas price on error
          try {
            const defaultGweiPrice = DEFAULT_GAS_PRICE[chain as keyof typeof DEFAULT_GAS_PRICE] || BigInt(5);
            const gasPrice = defaultGweiPrice * BigInt(1000000000); // Convert Gwei to Wei
            const gasLimit = isNative ? GAS_LIMIT.NATIVE_TRANSFER : GAS_LIMIT.ERC20_TRANSFER;
            const totalFee = gasPrice * gasLimit;
            const formattedFee = formatUnits(totalFee, 18);

            // Calculate USD value
            const nativeSymbol = NATIVE_SYMBOLS[chain as keyof typeof NATIVE_SYMBOLS] || 'ETH';
            const tokenPrice = tokenPrices[nativeSymbol]?.priceUSD || 0;
            const feeUSD = (parseFloat(formattedFee) * tokenPrice).toFixed(4);

            setEstimate({
              fee: formattedFee,
              feeUSD,
              loading: false,
              error: null
            });
          } catch (fallbackError) {
            setEstimate(prev => ({
              ...prev,
              loading: false,
              error: 'Failed to estimate gas fee'
            }));
          }
        }
      }
    };

    // Initial fetch
    fetchGasPrice();

    // Poll every 10 seconds
    pollInterval = setInterval(fetchGasPrice, 10000);

    return () => {
      mounted = false;
      if (pollInterval) {
        clearInterval(pollInterval);
      }
    };
  }, [chain, isNative, tokenPrices]);

  return estimate;
} 