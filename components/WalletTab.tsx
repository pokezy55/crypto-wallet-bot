'use client'

import { useState, useEffect, useMemo } from 'react';
import { Send, Download, ArrowLeftRight, Copy, Plus, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';
import { formatAddress } from '@/lib/address';
import { useBalance } from '../hooks/useBalance';
import { useTokenPrices } from '../hooks/useTokenPrices';
import { CHAINS } from '../lib/chain';
import { SendModal } from './SendModal';
import { SwapModal } from './SwapModal';
import { ReceiveModal } from './ReceiveModal';
import TokenRow from './TokenRow';

interface WalletTabProps {
  wallet?: {
    address: string;
    seedPhrase?: string;
    privateKey?: string;
  };
  user?: {
    id: number;
    first_name: string;
    last_name?: string;
    username?: string;
    photo_url?: string;
  };
  onWalletUpdate?: (wallet: any) => void;
  onHistoryUpdate?: (history: any[]) => void;
}

interface Token {
  symbol: string;
  name: string;
  logo?: string;
  balance: string;
  decimals: number;
  isNative: boolean;
  address?: string;
  chain: string;
}

interface TokenBalance extends Token {
  price: number;
  change: number;
}

interface TokenPrices {
  [key: string]: {
    priceUSD: number;
    priceChange24h: number;
  };
}

export default function WalletTab({ wallet, user, onWalletUpdate, onHistoryUpdate }: WalletTabProps) {
  // Early return if no wallet
  if (!wallet?.address) {
    return (
      <div className="p-6 text-center">
        <p>Please connect your wallet to continue</p>
      </div>
    );
  }

  // Early return if no user
  if (!user?.id) {
    return (
      <div className="p-6 text-center">
        <p>Please log in to continue</p>
      </div>
    );
  }

  const [chain, setChain] = useState('eth');
  const [isSendModalOpen, setIsSendModalOpen] = useState(false);
  const [isSwapModalOpen, setIsSwapModalOpen] = useState(false);
  const [isReceiveModalOpen, setIsReceiveModalOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // HOOK: Fetch balance
  const { balances: tokenBalances, loading: loadingBalance, error: balanceError, refetch } = useBalance(chain, wallet.address);
  const tokenPrices = useTokenPrices() as TokenPrices;

  // Handle refresh
  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refetch();
    } catch (error) {
      console.error('Error refreshing balances:', error);
      toast.error('Failed to refresh balances');
    } finally {
      setIsRefreshing(false);
    }
  };

  // Handle token actions
  const handleTokenAction = (action: 'send' | 'receive' | 'swap') => {
    if (action === 'send') {
      setIsSendModalOpen(true);
    } else if (action === 'receive') {
      setIsReceiveModalOpen(true);
    } else if (action === 'swap') {
      setIsSwapModalOpen(true);
    }
  };

  // Format token list
  const tokenList = useMemo(() => {
    if (!tokenBalances || !tokenPrices) return [];

    return (tokenBalances as Token[]).map((token): TokenBalance => ({
      ...token,
      price: tokenPrices[token.symbol]?.priceUSD || 0,
      change: tokenPrices[token.symbol]?.priceChange24h || 0
    }));
  }, [tokenBalances, tokenPrices]);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex justify-between items-center p-4 border-b border-crypto-border">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-semibold">Wallet</h2>
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="p-2 rounded-lg hover:bg-crypto-hover disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigator.clipboard.writeText(wallet.address)}
            className="flex items-center gap-1 text-sm text-gray-400 hover:text-white"
          >
            {formatAddress(wallet.address)}
            <Copy className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Token List */}
      <div className="flex-1 overflow-auto p-4">
        {loadingBalance ? (
          <div className="flex justify-center items-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
          </div>
        ) : balanceError ? (
          <div className="text-center text-red-500 p-4">
            Failed to load balances
          </div>
        ) : tokenList.length === 0 ? (
          <div className="text-center text-gray-400 p-4">
            No tokens found
          </div>
        ) : (
          <div className="space-y-4">
            {tokenList.map((token) => (
              <TokenRow
                key={`${token.symbol}-${token.chain}`}
                token={token}
                onSend={() => handleTokenAction('send')}
                onReceive={() => handleTokenAction('receive')}
                onSwap={() => handleTokenAction('swap')}
              />
            ))}
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="grid grid-cols-4 border-t border-crypto-border">
        <button
          onClick={() => handleTokenAction('send')}
          className="flex flex-col items-center justify-center p-4 hover:bg-crypto-hover"
        >
          <Send className="w-6 h-6 mb-1" />
          <span className="text-xs">Send</span>
        </button>
        <button
          onClick={() => handleTokenAction('receive')}
          className="flex flex-col items-center justify-center p-4 hover:bg-crypto-hover"
        >
          <Download className="w-6 h-6 mb-1" />
          <span className="text-xs">Receive</span>
        </button>
        <button
          onClick={() => handleTokenAction('swap')}
          className="flex flex-col items-center justify-center p-4 hover:bg-crypto-hover"
        >
          <ArrowLeftRight className="w-6 h-6 mb-1" />
          <span className="text-xs">Swap</span>
        </button>
        <button
          onClick={() => {/* TODO: Add token */}}
          className="flex flex-col items-center justify-center p-4 hover:bg-crypto-hover"
        >
          <Plus className="w-6 h-6 mb-1" />
          <span className="text-xs">Add</span>
        </button>
      </div>

      {/* Modals */}
      <SendModal
        isOpen={isSendModalOpen}
        onClose={() => setIsSendModalOpen(false)}
        chain={chain}
        seedPhrase={wallet.seedPhrase}
        privateKey={wallet.privateKey}
      />

      <SwapModal
        isOpen={isSwapModalOpen}
        onClose={() => setIsSwapModalOpen(false)}
        chain={chain}
        seedPhrase={wallet.seedPhrase}
        privateKey={wallet.privateKey}
      />

      <ReceiveModal
        isOpen={isReceiveModalOpen}
        onClose={() => setIsReceiveModalOpen(false)}
        address={wallet.address}
      />
    </div>
  );
}