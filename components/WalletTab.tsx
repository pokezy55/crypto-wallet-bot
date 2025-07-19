'use client'

import { useState, useEffect, useMemo } from 'react';
import { Send, Download, ArrowLeftRight, Copy, Plus, RefreshCw } from 'lucide-react';
import { formatAddress } from '@/lib/address';
import { useBalance } from '../hooks/useBalance';
import { useTokenPrices } from '../hooks/useTokenPrices';
import TokenRow from './TokenRow';
import { CHAINS } from '../lib/chain';
import toast from 'react-hot-toast';
import SendModal from './SendModal';
import { Token } from './ActionModal';

export default function WalletTab({ wallet }: { wallet: any }) {
  // Basic states
  const [chain, setChain] = useState('eth');
  const [activeModal, setActiveModal] = useState<'none' | 'send' | 'receive' | 'swap'>('none');
  const [selectedToken, setSelectedToken] = useState<Token | undefined>();

  // Hooks
  const { balances: tokenBalances, loading: loadingBalance, refetch } = useBalance(chain, wallet?.address);
  const tokenPrices = useTokenPrices();

  // Auto refresh
  useEffect(() => {
    refetch();
    const interval = setInterval(refetch, 60000);
    return () => clearInterval(interval);
  }, [refetch]);

  // Process token list
  const tokenList = useMemo(() => {
    const chains: Record<string, any> = CHAINS;
    const tokens = (chains[chain]?.tokens || []).map((def: any) => {
      const bal = tokenBalances.find(b => b.symbol.toLowerCase() === def.symbol.toLowerCase())?.balance || '0';
      const price = tokenPrices[def.symbol] || { priceUSD: 0, priceChange24h: 0 };
      return {
        ...def,
        balance: parseFloat(bal),
        priceUSD: price.priceUSD,
        priceChange24h: price.priceChange24h,
        chains: [chain.toUpperCase()],
        name: def.name || def.symbol,
        logo: def.logo || '',
        isMerged: false,
        isNative: def.isNative || false
      };
    });

    return tokens.sort((a, b) => {
      if (a.isNative && !b.isNative) return -1;
      if (!a.isNative && b.isNative) return 1;
      const aValue = a.balance * (a.priceUSD || 0);
      const bValue = b.balance * (b.priceUSD || 0);
      return bValue - aValue;
    });
  }, [chain, tokenBalances, tokenPrices]);

  // Calculate total value
  const totalValue = useMemo(() => {
    return tokenList.reduce((total, token) => {
      if (!token.balance || token.balance <= 0) return total;
      return total + (token.balance * (token.priceUSD || 0));
    }, 0);
  }, [tokenList]);

  // Handlers
  const handleCopyAddress = () => {
    if (wallet?.address) {
      navigator.clipboard.writeText(wallet.address);
      toast.success('Address copied!');
    }
  };

  const handleSendClick = (token?: Token) => {
    if (!wallet?.address) {
      toast.error('Please connect wallet first');
      return;
    }
    setSelectedToken(token || tokenList[0]);
    setActiveModal('send');
  };

  return (
    <div className="p-4">
      {/* Address & Chain Selector */}
      <div className="flex items-center justify-between mb-2">
        <span className="font-mono text-xs text-gray-400">
          {formatAddress(wallet.address)}
        </span>
        <div className="flex items-center gap-2">
          <button 
            onClick={refetch}
            disabled={loadingBalance}
            className="p-1 bg-gray-700 rounded hover:bg-primary-700 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 text-white ${loadingBalance ? 'animate-spin' : ''}`} />
          </button>
          <button 
            onClick={handleCopyAddress} 
            className="p-1 bg-gray-700 rounded hover:bg-primary-700"
          >
            <Copy className="w-4 h-4 text-white" />
          </button>
          {/* Chain Selector */}
          <select
            value={chain}
            onChange={e => setChain(e.target.value)}
            className="bg-crypto-card border border-crypto-border rounded-lg px-3 py-2"
          >
            <option value="eth">Ethereum</option>
            <option value="bsc">BSC</option>
            <option value="polygon">Polygon</option>
            <option value="base">Base</option>
          </select>
        </div>
      </div>

      {/* Total Value */}
      <div className="text-center mb-4">
        <div className="text-3xl font-bold text-white">
          ${totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </div>
        <div className="text-xs text-gray-400">Total Portfolio Value</div>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-between mb-6">
        <button 
          onClick={() => handleSendClick()}
          className="flex flex-col items-center text-gray-400 hover:text-white"
        >
          <Send className="w-6 h-6 mb-1" />
          <span className="text-xs">Send</span>
        </button>
        <button 
          className="flex flex-col items-center text-gray-400 hover:text-white"
        >
          <Download className="w-6 h-6 mb-1" />
          <span className="text-xs">Receive</span>
        </button>
        <button 
          className="flex flex-col items-center text-gray-400 hover:text-white"
        >
          <Plus className="w-6 h-6 mb-1" />
          <span className="text-xs">Add</span>
        </button>
      </div>

      {/* Token List */}
      <div className="space-y-2">
        {tokenList.map((token) => (
          <div
            key={`${token.symbol}-${token.chains[0]}`}
            className="relative group cursor-pointer"
            onClick={() => handleSendClick(token)}
          >
            <TokenRow
              symbol={token.symbol}
              name={token.name}
              logo={token.logo}
              balance={token.balance}
              priceUSD={token.priceUSD}
              priceChange24h={token.priceChange24h}
              chains={token.chains}
              isMerged={token.isMerged}
            />
          </div>
        ))}
      </div>

      {/* Modals */}
      <SendModal
        isOpen={activeModal === 'send'}
        onClose={() => {
          setActiveModal('none');
          setSelectedToken(undefined);
        }}
        selectedToken={selectedToken}
        chain={chain}
        wallet={wallet}
      />
    </div>
  );
} 