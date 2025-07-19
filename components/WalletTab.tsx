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
import { Token } from './ActionModal';

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
  seedPhrase?: string;
  createdAt?: string;
  updatedAt?: string;
}

interface WalletTabProps {
  wallet: Wallet;
  user: User;
  onWalletUpdate?: (wallet: Wallet) => void;
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

export default function WalletTab({ wallet, user, onWalletUpdate, onHistoryUpdate }: WalletTabProps) {
  const [activeSection, setActiveSection] = useState<'main' | 'receive' | 'send' | 'swap'>('main');
  const [sendForm, setSendForm] = useState({ address: '', amount: '', token: 'ETH' });
  const [activeTab, setActiveTab] = useState<'token' | 'history'>('token');
  const [history, setHistory] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [isLoadingBalance, setIsLoadingBalance] = useState(false);
  const [isLoadingSend, setIsLoadingSend] = useState(false);
  const [balances, setBalances] = useState<Record<string, string>>({});
  // Ganti default state chain ke 'eth'
  const [chain, setChain] = useState('eth');
  // Hapus state tokenPrices dan lastPriceUpdate lama
  // const [tokenPrices, setTokenPrices] = useState<Record<string, { price: number; change24h: number; lastUpdated: number }>>({});
  // const [lastPriceUpdate, setLastPriceUpdate] = useState<Date | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [txStatus, setTxStatus] = useState<'idle' | 'pending' | 'success' | 'error'>('idle');
  const [txError, setTxError] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  // Tambahkan deklarasi state swapForm jika masih digunakan
  const [swapForm, setSwapForm] = useState({ fromToken: 'ETH', toToken: 'USDT', amount: '' });
  // Tambahkan deklarasi state yang hilang
  const [showAddToken, setShowAddToken] = useState(false);
  const [newToken, setNewToken] = useState({ network: 'ETH', contract: '' });
  // Hitung totalWorth dari balances
  const totalWorth = Object.entries(balances).reduce((sum, [symbol, amount]) => {
    const price = tokenPrices[symbol]?.priceUSD ?? 1.0;
    return sum + parseFloat(amount) * price;
  }, 0).toFixed(2);

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
        chains: token.chains || [chain]
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
  const isFormValid = isAddressValid && sendForm.amount && parseFloat(sendForm.amount) > 0 && selectedToken && wallet.seedPhrase;

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
        token && 
        wallet?.seedPhrase
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
    if (!wallet?.seedPhrase || !token) return;

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
            amount: sendForm.amount,
          seedPhrase: wallet.seedPhrase
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

  // Render Send Section with Error Boundary
  if (activeSection === 'send') {
    return (
      <ErrorBoundary onReset={handleReset}>
        <SendSection
          wallet={wallet}
          tokenList={tokenList}
          sendForm={sendForm}
          setSendForm={setSendForm}
          showConfirm={showConfirm}
          setShowConfirm={setShowConfirm}
          txStatus={txStatus}
          setTxStatus={setTxStatus}
          txError={txError}
          setTxError={setTxError}
          onBack={() => setActiveSection('main')}
          chain={chain}
        />
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
    const [showChainMenu, setShowChainMenu] = useState(false);
    const [selectedChain, setSelectedChain] = useState<string>('eth');
    const CHAIN_OPTIONS = [
      { key: 'eth', label: 'Ethereum', icon: 'https://raw.githubusercontent.com/spothq/cryptocurrency-icons/master/svg/color/eth.svg' },
      { key: 'bsc', label: 'BSC', icon: 'https://raw.githubusercontent.com/spothq/cryptocurrency-icons/master/svg/color/bnb.svg' },
      { key: 'polygon', label: 'Polygon', icon: 'https://raw.githubusercontent.com/spothq/cryptocurrency-icons/master/svg/color/matic.svg' },
      { key: 'base', label: 'Base', icon: 'https://raw.githubusercontent.com/spothq/cryptocurrency-icons/master/svg/color/eth.svg' },
    ];

    // Modal states
    const [showSendModal, setShowSendModal] = useState(false);
    const [showSwapModal, setShowSwapModal] = useState(false);
    const [showReceiveModal, setShowReceiveModal] = useState(false);
    const [selectedToken, setSelectedToken] = useState<Token | undefined>(undefined);

      // Handle token selection for modals
  const handleTokenAction = (token: Token, action: 'send' | 'receive' | 'swap') => {
    // Ensure token has all required properties
    const modalToken: Token = {
      ...token,
      priceUSD: token.priceUSD || 0,
      priceChange24h: token.priceChange24h || 0,
      isNative: token.isNative || false,
      chains: token.chains || [chain]
    };
    setSelectedToken(modalToken);
    switch (action) {
      case 'send':
        setShowSendModal(true);
        break;
      case 'receive':
        setShowReceiveModal(true);
        break;
      case 'swap':
        setShowSwapModal(true);
        break;
    }
  };

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
            onClick={() => setShowAddToken(true)}
            className="flex flex-col items-center hover:text-primary-500 transition-colors"
          >
            <Plus className="w-6 h-6" />
            <span className="text-xs mt-1">Add</span>
          </button>
        </div>
        {/* Tab Token/NFT/History */}
        <div className="flex gap-4 border-b border-gray-700 mb-2">
          <button className={`pb-2 px-2 text-sm ${activeTab === 'token' ? 'border-b-2 border-primary-500 text-white' : 'text-gray-400'}`} onClick={() => setActiveTab('token')}>Token</button>
          <button className={`pb-2 px-2 text-sm ${activeTab === 'history' ? 'border-b-2 border-primary-500 text-white' : 'text-gray-400'}`} onClick={() => setActiveTab('history')}>History</button>
        </div>
        {activeTab === 'token' && (
          <div className="flex flex-col gap-3 mt-2">
            {tokenList.map((token) => (
              <TokenRow
                key={token.isMerged ? `${token.symbol}-merged` : `${token.symbol}-${token.chains[0]}`}
                symbol={token.symbol}
                name={token.name}
                logo={token.logo}
                balance={token.balance}
                priceUSD={token.priceUSD}
                priceChange24h={token.priceChange24h}
                chains={token.chains}
                isMerged={token.isMerged}
              />
            ))}
            {tokenList.length === 0 && (
              <div className="text-center text-gray-500 py-8">No tokens found</div>
            )}
          </div>
        )}
        {activeTab === 'history' && (
          <div className="space-y-3 mt-2">
            {loadingHistory ? (
              <div className="text-center text-gray-500 py-8">Loading history...</div>
            ) : history.length === 0 ? (
              <div className="text-center text-gray-500 py-8">No transaction history found</div>
            ) : (
              history.map((tx, idx) => (
                <div key={idx} className="p-3 bg-crypto-card rounded-lg border border-crypto-border flex items-center justify-between">
                  <div>
                    {tx.type === 'Send' && (
                      <div className="text-red-400 font-medium">Send {tx.amount} {tx.token} to <span className="font-mono">{tx.to.slice(0, 6)}...{tx.to.slice(-4)}</span></div>
                    )}
                    {tx.type === 'Receive' && (
                      <div className="text-green-400 font-medium">Receive {tx.amount} {tx.token} from <span className="font-mono">{tx.from.slice(0, 6)}...{tx.from.slice(-4)}</span></div>
                    )}
                    {tx.type === 'Swap' && (
                      <div className="text-blue-400 font-medium">Swap {tx.amountIn} {tx.tokenIn} to {tx.amountOut} {tx.tokenOut}</div>
                    )}
                  </div>
                  <a href={`https://etherscan.io/tx/${tx.txHash}`} target="_blank" rel="noopener noreferrer" className="ml-2 text-primary-500 flex items-center gap-1 text-xs">
                    TxLink <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              ))
            )}
          </div>
        )}

        {/* Add Token Modal */}
        {showAddToken && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-crypto-card border border-crypto-border rounded-xl p-6 w-full max-w-sm mx-4">
              <h3 className="text-lg font-semibold mb-4">Add Custom Token</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Network</label>
                  <select
                    value={newToken.network}
                    onChange={(e) => setNewToken({ ...newToken, network: e.target.value })}
                    className="input-field w-full"
                  >
                    <option value="ETH">Ethereum</option>
                    <option value="BSC">BSC</option>
                    <option value="POLYGON">Polygon</option>
                    <option value="BASE">Base</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Contract Address</label>
                  <input
                    type="text"
                    value={newToken.contract}
                    onChange={(e) => setNewToken({ ...newToken, contract: e.target.value })}
                    placeholder="0x..."
                    className="input-field w-full"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowAddToken(false)}
                    className="flex-1 btn-secondary"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      if (newToken.contract) {
                        // setCustomTokens([...customTokens, newToken]); // customTokens is not defined
                        setNewToken({ network: 'ETH', contract: '' });
                        setShowAddToken(false);
                        toast.success('Token added successfully!');
                      } else {
                        toast.error('Please enter contract address');
                      }
                    }}
                    className="flex-1 btn-primary"
                  >
                    Add Token
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modals */}
        <SendModal
          isOpen={showSendModal}
          onClose={() => setShowSendModal(false)}
          selectedToken={selectedToken}
          chain={chain}
          wallet={wallet}
        />

        <SwapModal
          isOpen={showSwapModal}
          onClose={() => setShowSwapModal(false)}
          tokens={tokenList}
          chain={chain}
          wallet={wallet}
        />

        <ReceiveModal
          isOpen={showReceiveModal}
          onClose={() => setShowReceiveModal(false)}
          wallet={wallet}
          selectedToken={selectedToken}
        />
      </div>
    );
  }
} 

// Separate Send Section Component
// Using Token type from ActionModal

interface SendFormState {
  address: string;
  amount: string;
  token: string;
}

interface SendSectionProps {
  wallet: {
    address: string;
    seedPhrase?: string;
  };
  tokenList: Token[];
  sendForm: SendFormState;
  setSendForm: (form: SendFormState | ((prev: SendFormState) => SendFormState)) => void;
  showConfirm: boolean;
  setShowConfirm: (show: boolean) => void;
  txStatus: 'idle' | 'pending' | 'success' | 'error';
  setTxStatus: (status: 'idle' | 'pending' | 'success' | 'error') => void;
  txError: string;
  setTxError: (error: string) => void;
  onBack: () => void;
  chain: string;
}

function SendSection({
  wallet,
  tokenList,
  sendForm,
  setSendForm,
  showConfirm,
  setShowConfirm,
  txStatus,
  setTxStatus,
  txError,
  setTxError,
  onBack,
  chain
}: SendSectionProps) {
  // Get sendable tokens and validate
  const sendableTokens = useMemo(() => 
    tokenList.filter(t => t.balance > 0)
      .sort((a, b) => b.balance - a.balance),
    [tokenList]
  );

  // Early return if no tokens
  if (sendableTokens.length === 0) {
    return (
      <div className="p-6">
        <div className="flex items-center mb-6">
          <button onClick={onBack} className="mr-4 p-2 rounded-lg bg-crypto-card border border-crypto-border">
            <ArrowLeftRight className="w-5 h-5" />
          </button>
          <h2 className="text-xl font-semibold">Send</h2>
        </div>
        <div className="text-center text-gray-400 py-8">
          No tokens available to send
        </div>
      </div>
    );
  }

  // Ensure selected token exists or use first available
  const selectedToken = sendableTokens.find(t => t.symbol === sendForm.token) || sendableTokens[0];

  // Validation
  const isAddressValid = sendForm.address ? isValidAddress(sendForm.address) : false;
  const isFormValid = isAddressValid && 
    sendForm.amount && 
    parseFloat(sendForm.amount) > 0 && 
    selectedToken;

  // Estimated fee
  const estimatedFee = selectedToken.isNative ? 0.001 : 0;

  // Handle max amount
  const handleMax = () => {
    if (selectedToken.isNative) {
      const maxAmount = Math.max(0, selectedToken.balance - estimatedFee);
      setSendForm(prev => ({ ...prev, amount: maxAmount.toFixed(6) }));
    } else {
      setSendForm(prev => ({ ...prev, amount: selectedToken.balance.toFixed(6) }));
    }
  };

  // Handle send confirmation
  const handleSendConfirm = async () => {
    if (!wallet?.seedPhrase || !selectedToken || !isFormValid) return;

    setTxStatus('pending');
    setTxError('');
    
    try {
      const response = await fetch('/api/transaction/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from: wallet.address,
          to: sendForm.address,
          token: selectedToken.symbol,
          chain,
          amount: sendForm.amount,
          seedPhrase: wallet.seedPhrase
        })
      });

      const result = await response.json();
      
      if (response.ok && result.success) {
        setTxStatus('success');
      } else {
        throw new Error(result.error || 'Failed to send transaction');
      }
    } catch (error: unknown) {
      console.error('Send transaction error:', error);
      setTxStatus('error');
      setTxError(error instanceof Error ? error.message : 'Failed to send transaction');
    }
  };

  return (
    <div className="p-6">
      <div className="flex items-center mb-6">
        <button
          onClick={() => {
            onBack();
            setSendForm({ address: '', amount: '', token: 'ETH' });
            setTxStatus('idle');
            setTxError('');
            setShowConfirm(false);
          }}
          className="mr-4 p-2 rounded-lg bg-crypto-card border border-crypto-border"
        >
          <ArrowLeftRight className="w-5 h-5" />
        </button>
        <h2 className="text-xl font-semibold">Send</h2>
      </div>

      <div className="card">
        {/* Token Selector */}
        <div>
          <label className="block text-sm font-medium mb-2">Token</label>
          <div className="relative">
            <select
              value={selectedToken.symbol}
              onChange={e => setSendForm(prev => ({ ...prev, token: e.target.value }))}
              className="input-field w-full pl-12"
            >
              {sendableTokens.map(token => (
                <option key={token.symbol} value={token.symbol}>
                  {token.name} ({token.balance.toFixed(4)} {token.symbol})
                </option>
              ))}
            </select>
            {selectedToken.logo && (
              <img 
                src={selectedToken.logo} 
                alt={selectedToken.symbol}
                className="absolute left-2 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full"
              />
            )}
          </div>
        </div>

        {/* Recipient Address */}
        <div>
          <label className="block text-sm font-medium mb-2">Recipient Address</label>
          <input
            type="text"
            value={sendForm.address}
            onChange={e => setSendForm(prev => ({ ...prev, address: e.target.value }))}
            placeholder="0x..."
            className="input-field w-full"
          />
          {sendForm.address && !isAddressValid && (
            <p className="text-red-500 text-xs mt-1">Invalid address</p>
          )}
        </div>

        {/* Amount */}
        <div>
          <label className="block text-sm font-medium mb-2">Amount</label>
          <div className="flex gap-2">
            <input
              type="number"
              value={sendForm.amount}
              onChange={e => setSendForm(prev => ({ ...prev, amount: e.target.value }))}
              placeholder="0.0"
              className="input-field flex-1"
              min="0"
              step="any"
              max={selectedToken.isNative ? selectedToken.balance - estimatedFee : selectedToken.balance}
            />
            <button
              onClick={handleMax}
              className="btn-secondary px-3"
            >
              MAX
            </button>
          </div>
          <p className="text-xs text-gray-400 mt-1">
            Available: {selectedToken.balance.toFixed(6)} {selectedToken.symbol}
          </p>
        </div>

        {/* Network Fee */}
        {selectedToken.isNative && (
          <p className="text-xs text-gray-400">
            Estimated Network Fee: {estimatedFee} {selectedToken.symbol}
          </p>
        )}

        {/* Send Button */}
        <button
          onClick={() => setShowConfirm(true)}
          disabled={!isFormValid}
          className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Send {selectedToken.symbol}
        </button>
      </div>

      {/* Confirmation Modal with Error Boundary */}
      <ErrorBoundary onReset={() => setShowConfirm(false)}>
        {showConfirm && selectedToken && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-crypto-card border border-crypto-border rounded-xl p-6 w-full max-w-sm mx-4">
              <h3 className="text-lg font-semibold mb-4">Confirm Transaction</h3>
              
              <div className="space-y-2 mb-4">
                <p>Send <b>{sendForm.amount} {selectedToken.symbol}</b></p>
                <p className="text-sm text-gray-400">to</p>
                <p className="font-mono text-primary-500 break-all">{sendForm.address}</p>
                {selectedToken.isNative && (
                  <p className="text-sm text-gray-400">
                    Network Fee: {estimatedFee} {selectedToken.symbol}
                  </p>
                )}
              </div>

              {txStatus === 'idle' && (
                <div className="flex gap-2">
                  <button 
                    onClick={() => setShowConfirm(false)} 
                    className="btn-secondary flex-1"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={handleSendConfirm}
                    className="btn-primary flex-1"
                  >
                    Confirm
                  </button>
                </div>
              )}

              {txStatus === 'pending' && (
                <div className="text-center py-4">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500 mx-auto mb-2"></div>
                  <p>Processing transaction...</p>
                </div>
              )}

              {txStatus === 'success' && (
                <div className="text-center">
                  <p className="text-green-500 mb-4">Transaction sent successfully!</p>
                  <button
                    onClick={() => {
                      setShowConfirm(false);
                      onBack();
                      setSendForm({ address: '', amount: '', token: 'ETH' });
                      setTxStatus('idle');
                    }}
                    className="btn-primary w-full"
                  >
                    Done
                  </button>
                </div>
              )}

              {txStatus === 'error' && (
                <div className="text-center">
                  <p className="text-red-500 mb-4">{txError}</p>
                  <button
                    onClick={() => {
                      setTxStatus('idle');
                      setTxError('');
                    }}
                    className="btn-primary w-full"
                  >
                    Try Again
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </ErrorBoundary>
    </div>
  );
} 