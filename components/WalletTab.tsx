'use client'

import { useState, useEffect, useMemo, Component, useRef } from 'react';
import { Send, Download, ArrowLeftRight, Copy, QrCode, Plus, Settings, RefreshCw, ExternalLink, Globe } from 'lucide-react';
import toast from 'react-hot-toast';
import QRCode from 'qrcode.react';
import { formatAddress, isValidAddress } from '@/lib/address';
import { getCachedTokenPrices } from '@/lib/crypto-prices';
import { Eth, Bnb, Pol, Base, Usdt } from './TokenIcons';
import { useBalance } from '../hooks/useBalance';
import { useSendToken } from '../hooks/useSendToken';
import { getTokenList } from '../lib/chain';
import TokenRow from './TokenRow';
import { useTokenPrices } from '../hooks/useTokenPrices';
import { CHAINS, TOKEN_GROUPS, shouldMergeToken, isNativeToken, getTokenPriority } from '../lib/chain';
import SendModal from './SendModal';
import SwapModal from './SwapModal';
import ReceiveModal from './ReceiveModal';
import { Token, ActionModalProps } from './ActionModal';

// Error Boundary Component
interface ErrorBoundaryProps {
  children: React.ReactNode;
  onReset?: () => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-6 text-center">
          <h3 className="text-red-500 mb-2">Something went wrong</h3>
          <button
            onClick={() => {
              this.setState({ hasError: false, error: null });
              if (this.props.onReset) this.props.onReset();
            }}
            className="btn-primary"
          >
            Try Again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

// Removed local SendModal definition as we're using the imported one

// --- TypeScript types for backend response ---
interface BalanceResponse {
  balances: Record<string, string>;
  chain: string;
  error?: string;
}
interface SendResponse {
  txHash?: string;
  error?: string;
  detail?: string;
}

interface User {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
}

interface Wallet {
  id: string;
  address: string;
  createdAt?: string;
  updatedAt?: string;
}

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

interface TokenBalance {
  symbol: string;
  name: string;
  chain: string;
  amount: number;
  icon: JSX.Element;
  price: number;
  change: number;
  fiat: number;
}

const TOKEN_ORDER = ['ETH', 'BNB', 'MATIC', 'POL', 'BASE', 'USDT', 'USDC', 'USDbC'];
const STABLECOINS = ['USDT', 'USDC', 'USDbC'];

interface TokenRowProps {
  token: Token;
  onSend: () => void;
  onReceive: () => void;
  onSwap: () => void;
}

interface SwapModalProps extends ActionModalProps {}
interface ReceiveModalProps extends ActionModalProps {}
interface SendModalProps extends ActionModalProps {}

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

  const [activeSection, setActiveSection] = useState<'main' | 'receive' | 'send' | 'swap'>('main');
  const [sendForm, setSendForm] = useState({ address: '', amount: '', token: 'ETH' });
  const [activeTab, setActiveTab] = useState<'token' | 'history'>('token');
  const [history, setHistory] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [isLoadingBalance, setIsLoadingBalance] = useState(false);
  const [isLoadingSend, setIsLoadingSend] = useState(false);
  const [balances, setBalances] = useState<Record<string, string>>({});
  const [chain, setChain] = useState('eth');
  const [showConfirm, setShowConfirm] = useState(false);
  const [txStatus, setTxStatus] = useState<'idle' | 'pending' | 'success' | 'error'>('idle');
  const [txError, setTxError] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [swapForm, setSwapForm] = useState({ fromToken: 'ETH', toToken: 'USDT', amount: '' });
  const [showAddToken, setShowAddToken] = useState(false);
  const [newToken, setNewToken] = useState({ network: 'ETH', contract: '' });
  const [showChainMenu, setShowChainMenu] = useState(false);
  const [selectedChain, setSelectedChain] = useState<string>('eth');
  const [showSendModal, setShowSendModal] = useState(false);
  const [showSwapModal, setShowSwapModal] = useState(false);
  const [showReceiveModal, setShowReceiveModal] = useState(false);
  const [selectedTokenState, setSelectedTokenState] = useState<Token | undefined>(undefined);
  const [showSwapMaintenance, setShowSwapMaintenance] = useState(false);

  const CHAIN_OPTIONS = [
    { key: 'eth', label: 'Ethereum', icon: 'https://raw.githubusercontent.com/spothq/cryptocurrency-icons/master/svg/color/eth.svg' },
    { key: 'bsc', label: 'BSC', icon: 'https://raw.githubusercontent.com/spothq/cryptocurrency-icons/master/svg/color/bnb.svg' },
    { key: 'polygon', label: 'Polygon', icon: 'https://raw.githubusercontent.com/spothq/cryptocurrency-icons/master/svg/color/matic.svg' },
    { key: 'base', label: 'Base', icon: 'https://raw.githubusercontent.com/spothq/cryptocurrency-icons/master/svg/color/eth.svg' },
  ];

  // HOOK: Fetch balance
  const { balances: tokenBalances, loading: loadingBalance, error: hookBalanceError, refetch } = useBalance(chain, wallet?.address);
  const tokenPrices = useTokenPrices();
  // HOOK: Send token
  const { sendToken: hookSendToken, loading: loadingSend, error: hookSendError, txHash: hookTxHash } = useSendToken();

  // Ambil balances dari wallet jika ada
  const walletBalances: Record<string, any> = {};
  walletBalances[chain] = {};
  tokenBalances.forEach((token: any) => {
    walletBalances[chain][token.symbol.toLowerCase()] = token.balance;
  });

  // Pilih balances sesuai chain aktif
  const activeBalances: Record<string, any> = walletBalances[chain] || {};
  let tokenList: any[] = [];

  if (chain === 'all') {
    // Get all tokens from all chains
    const allTokens: any[] = [];
    Object.entries(CHAINS).forEach(([chainId, chainData]: [string, any]) => {
      const chainTokens = chainData.tokens.map((def: any) => {
        const bal = tokenBalances[chainId]?.[def.symbol.toLowerCase()] || tokenBalances[chainId]?.[def.symbol] || '0';
        const price = tokenPrices[def.symbol] || { priceUSD: 0, priceChange24h: 0 };
        return {
          ...def,
          balance: parseFloat(bal),
          priceUSD: price.priceUSD,
          priceChange24h: price.priceChange24h,
          chains: [chainId.toUpperCase()],
          name: def.name || def.symbol,
          logo: def.logo || '',
          isMerged: false,
          isNative: def.isNative || false // Mark native tokens
        };
      });
      allTokens.push(...chainTokens);
    });

    // Merge tokens
    const mergedTokens: Record<string, any> = {};
    allTokens.forEach((token) => {
      if (shouldMergeToken(token.symbol)) {
        // Merge stablecoins
        if (!mergedTokens[token.symbol]) {
          const price = tokenPrices[token.symbol] || { priceUSD: 0, priceChange24h: 0 };
          mergedTokens[token.symbol] = {
            symbol: token.symbol,
            name: token.name || token.symbol,
            logo: token.logo || '',
            balance: 0,
            priceUSD: price.priceUSD,
            priceChange24h: price.priceChange24h,
            chains: [],
            isMerged: true,
            isNative: false
          };
        }
        mergedTokens[token.symbol].balance += token.balance || 0;
        if (token.balance > 0) {
          mergedTokens[token.symbol].chains.push(token.chains[0]);
        }
      } else {
        // Keep native tokens and other tokens separate
        const key = `${token.symbol}-${token.chains[0]}`;
        if (!mergedTokens[key]) {
          mergedTokens[key] = token;
        }
      }
    });

          // Convert to array and sort: native tokens first, then by value
      tokenList = Object.values(mergedTokens).map(token => ({
        ...token,
        priceUSD: token.priceUSD || 0,
        priceChange24h: token.priceChange24h || 0,
        isNative: token.isNative || false,
        chains: token.chains || [chain],
        decimals: token.decimals || 18, // Default to 18 decimals if not specified
        address: token.address
      })).sort((a, b) => {
        // Native tokens always come first
        if (a.isNative && !b.isNative) return -1;
        if (!a.isNative && b.isNative) return 1;
        
        // Then sort by value
        const aValue = a.balance * (a.priceUSD || 0);
        const bValue = b.balance * (b.priceUSD || 0);
        return bValue - aValue;
      });

  } else {
    // Single chain logic (unchanged)
    const chains: Record<string, any> = CHAINS;
    tokenList = (chains[chain]?.tokens || []).map((def: any) => {
      const bal = activeBalances[def.symbol.toLowerCase()] || activeBalances[def.symbol] || '0';
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

    // Sort tokens: native first, then by value
    tokenList.sort((a, b) => {
      if (a.isNative && !b.isNative) return -1;
      if (!a.isNative && b.isNative) return 1;
      
      const aValue = a.balance * (a.priceUSD || 0);
      const bValue = b.balance * (b.priceUSD || 0);
      return bValue - aValue;
    });
  }
  console.log('tokenList with prices', tokenList);

  // Setelah tokenList didefinisikan:
  // console.log('tokenList', tokenList);

  // Calculate total portfolio value
  const totalValue = useMemo(() => {
    return tokenList.reduce((total, token) => {
      if (!token.balance || token.balance <= 0) return total;
      const value = token.balance * (token.priceUSD || 0);
      return total + value;
    }, 0);
  }, [tokenList]);

  // Auto refresh balances
  useEffect(() => {
    // Initial fetch
    refetch();

    // Set up polling every 60 seconds
    const interval = setInterval(refetch, 60000);

    // Cleanup interval on unmount
    return () => clearInterval(interval);
  }, [refetch]);

  // --- Send Form Validasi ---
  const selectedToken = tokenList.find(t => t.symbol === sendForm.token) || tokenList[0];
  const isAddressValid = isValidAddress(sendForm.address);
  const isFormValid = isAddressValid && sendForm.amount && parseFloat(sendForm.amount) > 0 && selectedToken;

  // --- UI & Handler ---
  // ... (lanjutkan dengan render dan handler, gunakan state baru di atas)
  // ... (hapus logic balance/send lama yang tidak relevan)

  useEffect(() => {
    if (activeTab === 'history') {
      setLoadingHistory(true);
      fetch(`/api/wallet/${user.id}/history`)
        .then(res => res.json())
        .then(data => setHistory(data.history || []))
        .catch(() => setHistory([]))
        .finally(() => setLoadingHistory(false));
    }
  }, [activeTab, user.id]);

  const refreshWallet = async () => {
    setIsRefreshing(true);
    try {
      // Fetch fresh prices
      const prices = await getCachedTokenPrices();
      // setTokenPrices(prices); // Hapus state tokenPrices lama
      // setLastPriceUpdate(new Date()); // Hapus state lastPriceUpdate lama
      toast.success('Wallet refreshed!');
    } catch (error) {
      toast.error('Failed to refresh wallet');
    } finally {
      setIsRefreshing(false);
    }
  };

  const copyAddress = () => {
    if (isValidAddress(wallet.address)) {
      navigator.clipboard.writeText(wallet.address)
      toast.success('Address copied to clipboard!')
    } else {
      toast.error('Invalid wallet address!')
    }
  }

  const handleSend = async () => {
    setIsLoadingSend(true);
    
    if (!sendForm.address || !sendForm.amount) {
      toast.error('Please fill in all fields');
      setIsLoadingSend(false);
      return;
    }
    if (!isValidAddress(sendForm.address)) {
      toast.error('Wrong address format');
      setIsLoadingSend(false);
      return;
    }
    
    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Here you would implement the actual send logic via API
      // const response = await fetch('/api/transaction/create', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({
      //     walletId: wallet.id,
      //     txType: 'send',
      //     toAddress: sendForm.address,
      //     tokenSymbol: sendForm.token,
      //     amount: sendForm.amount
      //   })
      // });
      
      // if (response.ok) {
      //   toast.success('Transaction sent!')
      //   setActiveSection('main')
      // } else {
      //   toast.error('Failed to send transaction')
      // }
      
      toast.success('Transaction sent successfully!')
        setActiveSection('main')
      setSendForm({ address: '', amount: '', token: 'ETH' })
    } catch (error) {
      toast.error('Network error')
    } finally {
      setIsLoadingSend(false);
    }
  }

  const handleSwap = async () => {
    if (!swapForm.amount) {
      toast.error('Please enter amount')
      return
    }
    
    setIsLoadingSend(true);
    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
    // Here you would implement the actual swap logic
      toast.success('Swap executed successfully!')
    setActiveSection('main')
      setSwapForm({ fromToken: 'ETH', toToken: 'USDT', amount: '' })
    } catch (error) {
      toast.error('Swap failed')
    } finally {
      setIsLoadingSend(false);
    }
  }

  const confirmRef = useRef(null);

  // Tambahkan fungsi refreshWalletAndHistory di dalam WalletTab
  const refreshWalletAndHistory = async () => {
    // Panggil ulang API wallet
    const walletRes = await fetch(`/api/wallet/${user.id}`);
    if (walletRes.ok) {
      if (onWalletUpdate) onWalletUpdate(await walletRes.json());
    }
    // Panggil ulang API history
    const historyRes = await fetch(`/api/wallet/${user.id}/history`);
    if (historyRes.ok) {
      if (onHistoryUpdate) onHistoryUpdate((await historyRes.json()).history || []);
    }
  };

  // Validation helpers
  const validateSendForm = (form: any, token: any) => {
    const addressValid = isValidAddress(form.address);
    return {
      isAddressValid: addressValid,
      isFormValid: addressValid && 
        form.amount && 
        parseFloat(form.amount) > 0 && 
        token
    };
  };

  // Send Form Handlers
  const handleSendClick = () => {
    if (!wallet?.address) {
      toast.error('Please connect wallet first');
      return;
    }
    setActiveSection('send');
  };

    const handleSendConfirm = async () => {
    const token = tokenList.find(t => t.symbol === sendForm.token);
    if (!token) return;

      setTxStatus('pending');
      setTxError('');
    
      try {
        const response = await fetch('/api/transaction/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            from: wallet.address,
            to: sendForm.address,
          token: token.symbol,
          chain: chain,
            amount: sendForm.amount
          })
        });

        const result = await response.json();
      
      if (response.ok && result.success) {
          setTxStatus('success');
        // Refresh balances after successful send
        await refetch();
        } else {
          setTxStatus('error');
          setTxError(result.error || 'Failed to send transaction');
        }
    } catch (error) {
      console.error('Send transaction error:', error);
        setTxStatus('error');
        setTxError('Failed to send transaction');
      }
    };

  // Reset handler for error boundary
  const handleReset = () => {
    setActiveSection('main');
    setSendForm({ address: '', amount: '', token: 'ETH' });
    setTxStatus('idle');
    setTxError('');
    setShowConfirm(false);
  };

  // Handle token selection for modals
  const handleTokenAction = (token: Token, action: 'send' | 'receive' | 'swap') => {
    // Validate wallet first
    if (!wallet?.address) {
      toast.error('Please connect your wallet');
      return;
    }

    // Ensure token has all required properties
    const modalToken: Token = {
      ...token,
      priceUSD: token.priceUSD || 0,
      priceChange24h: token.priceChange24h || 0,
      isNative: token.isNative || false,
      chains: token.chains || [chain],
      decimals: token.decimals || 18
    };

    setSelectedTokenState(modalToken);

    switch (action) {
      case 'send':
        setShowSendModal(true);
        break;
      case 'receive':
        setShowReceiveModal(true);
        break;
      case 'swap':
        setShowSwapMaintenance(true);
        break;
    }
  };

  // Render Send Section with Error Boundary
  if (activeSection === 'send') {
    return (
      <ErrorBoundary onReset={handleReset}>
      <div className="p-6">
        <div className="flex items-center mb-6">
            <button onClick={() => setActiveSection('main')} className="mr-4 p-2 rounded-lg bg-crypto-card border border-crypto-border">
            <ArrowLeftRight className="w-5 h-5" />
          </button>
          <h2 className="text-xl font-semibold">Send</h2>
        </div>
          {/* Send form content */}
        </div>
      </ErrorBoundary>
    );
  }

  if (activeSection === 'swap') {
    return (
      <div className="p-6">
        <div className="flex items-center mb-6">
          <button
            onClick={() => setActiveSection('main')}
            className="mr-4 p-2 rounded-lg bg-crypto-card border border-crypto-border"
          >
            <ArrowLeftRight className="w-5 h-5" />
          </button>
          <h2 className="text-xl font-semibold">Swap</h2>
        </div>

        <div className="card">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">From</label>
              <div className="flex gap-2">
                <input
                  type="number"
                  value={swapForm.amount}
                  onChange={(e) => setSwapForm({ ...swapForm, amount: e.target.value })}
                  placeholder="0.0"
                  className="input-field flex-1"
                />
                <select
                  value={swapForm.fromToken}
                  onChange={(e) => setSwapForm({ ...swapForm, fromToken: e.target.value })}
                  className="input-field w-24"
                >
                  <option value="ETH">ETH</option>
                  <option value="USDT">USDT</option>
                  <option value="BNB">BNB</option>
                  <option value="POLYGON">POLYGON</option>
                  <option value="BASE">BASE</option>
                </select>
              </div>
            </div>

            <div className="text-center">
              <ArrowLeftRight className="w-6 h-6 mx-auto text-gray-400" />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">To</label>
              <div className="flex gap-2">
                <input
                  type="number"
                  value={swapForm.amount ? (
                    swapForm.fromToken === 'ETH' && swapForm.toToken === 'USDT' 
                      ? (parseFloat(swapForm.amount) * 1800).toFixed(2)
                      : swapForm.fromToken === 'USDT' && swapForm.toToken === 'ETH'
                      ? (parseFloat(swapForm.amount) / 1800).toFixed(6)
                      : swapForm.amount
                  ) : ''}
                  readOnly
                  placeholder="0.0"
                  className="input-field flex-1 bg-crypto-dark"
                />
                <select
                  value={swapForm.toToken}
                  onChange={(e) => setSwapForm({ ...swapForm, toToken: e.target.value })}
                  className="input-field w-24"
                >
                  <option value="USDT">USDT</option>
                  <option value="ETH">ETH</option>
                  <option value="BNB">BNB</option>
                  <option value="POLYGON">POLYGON</option>
                </select>
              </div>
            </div>

            <button
              onClick={handleSwap}
              disabled={isLoadingSend}
              className="w-full btn-primary flex items-center justify-center gap-2"
            >
              {isLoadingSend ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Processing...
                </>
              ) : (
                'Swap via Uniswap'
              )}
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (activeSection === 'main') {
    return (
      <div className="p-4">
        {/* Address & Copy + Chain Selector */}
        <div className="flex items-center justify-between mb-2">
          <span className="font-mono text-xs text-gray-400">{wallet.address.slice(0, 6)}...{wallet.address.slice(-4)}</span>
          <div className="flex items-center gap-2">
            <button 
              onClick={refetch}
              disabled={loadingBalance}
              className="p-1 bg-gray-700 rounded hover:bg-primary-700 disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 text-white ${loadingBalance ? 'animate-spin' : ''}`} />
            </button>
          <button onClick={copyAddress} className="p-1 bg-gray-700 rounded hover:bg-primary-700">
            <Copy className="w-4 h-4 text-white" />
          </button>
            {/* Chain Selector Button */}
            <div className="relative">
              <button
                className="w-9 h-9 rounded-full flex items-center justify-center bg-gray-800 border border-gray-700 hover:bg-gray-700 transition-colors"
                onClick={() => setShowChainMenu(v => !v)}
              >
                <img
                  src={CHAIN_OPTIONS.find(c => c.key === selectedChain)?.icon || ''}
                  alt={selectedChain}
                  className="w-6 h-6 rounded-full"
                />
              </button>
              {/* Dropdown/Popover */}
              {showChainMenu && (
                <div className="absolute right-0 mt-2 w-44 bg-crypto-card border border-crypto-border rounded-lg shadow-lg z-50 animate-fade-in">
                  {CHAIN_OPTIONS.map(opt => (
                    <button
                      key={opt.key}
                      className={`flex items-center gap-2 w-full px-4 py-2 text-left hover:bg-primary-600/20 transition-colors ${selectedChain === opt.key ? 'bg-primary-900/40' : ''}`}
                      onClick={() => {
                        setSelectedChain(opt.key);
                        setChain(opt.key);
                        setShowChainMenu(false);
                        refetch();
                      }}
                    >
                      <img src={opt.icon} alt={opt.label} className="w-5 h-5 rounded-full" />
                      <span className="text-white">{opt.label}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Total Worth */}
        <div className="text-center mb-2">
          <div className="text-3xl font-bold text-white">
            ${totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="text-xs text-gray-400 flex items-center justify-center gap-1">
            <span>Total Portfolio Value</span>
            <span className="text-gray-500">|</span>
            <span className="flex items-center gap-1">
              <Eth className="w-3 h-3" />
              {tokenList.find(t => t.symbol === 'ETH')?.balance.toFixed(4) || '0.0000'}
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-between items-center mb-4 px-2">
          <button 
            onClick={() => handleTokenAction(tokenList[0], 'send')}
            className="flex flex-col items-center hover:text-primary-500 transition-colors"
          >
            <Send className="w-6 h-6" />
            <span className="text-xs mt-1">Send</span>
          </button>
          <button 
            onClick={() => handleTokenAction(tokenList[0], 'receive')}
            className="flex flex-col items-center hover:text-primary-500 transition-colors"
          >
            <Download className="w-6 h-6" />
            <span className="text-xs mt-1">Receive</span>
          </button>
          <button 
            onClick={() => handleTokenAction(tokenList[0], 'swap')}
            className="flex flex-col items-center hover:text-primary-500 transition-colors"
          >
            <ArrowLeftRight className="w-6 h-6" />
            <span className="text-xs mt-1">Swap</span>
          </button>
          <button 
            onClick={() => toast.error('Swap Feature are currently Maintenance. Please use Uniswap directly for now.')}
            className="flex flex-col items-center hover:text-primary-500 transition-colors"

        {/* Tab Token/NFT/History */}
        <div className="flex gap-4 border-b border-gray-700 mb-2">
          <button 
            className={`pb-2 px-2 text-sm ${activeTab === 'token' ? 'border-b-2 border-primary-500 text-white' : 'text-gray-400'}`} 
            onClick={() => setActiveTab('token')}
          >
            Token
          </button>
          <button 
            className={`pb-2 px-2 text-sm ${activeTab === 'history' ? 'border-b-2 border-primary-500 text-white' : 'text-gray-400'}`} 
            onClick={() => setActiveTab('history')}
          >
            History
          </button>
        </div>

        {/* Token List */}
        {activeTab === 'token' && (
          <div className="space-y-2">
            {tokenList.map((token, index) => (
              <TokenRow
                key={`${token.symbol}-${index}`}
                token={token}
                onSend={() => handleTokenAction(token, 'send')}
                onReceive={() => handleTokenAction(token, 'receive')}
                onSwap={() => handleTokenAction(token, 'swap')}
              />
            ))}
          </div>
        )}

        {/* History */}
        {activeTab === 'history' && (
          <div className="space-y-2">
            {loadingHistory ? (
              <div className="text-center py-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500 mx-auto"></div>
              </div>
            ) : history.length > 0 ? (
              history.map((tx, index) => (
                <div key={index} className="p-3 bg-crypto-card rounded-lg">
                  <div className="flex items-center justify-between">
                  <div>
                      <div className="text-sm">{tx.type}</div>
                      <div className="text-xs text-gray-400">{tx.date}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm">{tx.amount} {tx.token}</div>
                      <div className="text-xs text-gray-400">{tx.status}</div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center text-gray-400 py-4">
                No transaction history
              </div>
            )}
          </div>
        )}

        {/* Modals */}
        <SendModal
          isOpen={showSendModal}
          onClose={() => setShowSendModal(false)}
          selectedToken={selectedTokenState}
          chain={chain}
          wallet={{
            address: wallet.address,
            seedPhrase: wallet.seedPhrase,
            privateKey: wallet.privateKey
          }}
        />
        
        <SwapModal
          isOpen={showSwapModal}
          onClose={() => setShowSwapModal(false)}
          tokens={tokenList}
          chain={chain}
          wallet={{
            address: wallet.address,
            seedPhrase: wallet.seedPhrase,
            privateKey: wallet.privateKey
          }}
        />
        
        <ReceiveModal
          isOpen={showReceiveModal}
          onClose={() => setShowReceiveModal(false)}
          address={wallet.address}
        />
      </div>
    );
  }

  return null;
} 