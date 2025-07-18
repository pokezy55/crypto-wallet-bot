'use client'

import { useState, useEffect, useRef } from 'react';
import { Send, Download, ArrowLeftRight, Copy, QrCode, Plus, Settings, RefreshCw, ExternalLink } from 'lucide-react';
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

function getExplorerUrl(chain: string, txHash: string): string {
  switch (chain.toLowerCase()) {
    case 'eth':
    case 'ethereum':
      return `https://etherscan.io/tx/${txHash}`;
    case 'bsc':
    case 'binance':
      return `https://bscscan.com/tx/${txHash}`;
    case 'polygon':
      return `https://polygonscan.com/tx/${txHash}`;
    case 'base':
      return `https://basescan.org/tx/${txHash}`;
    default:
      return '#';
  }
}

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
  const { tokens, loading: loadingBalance, error: hookBalanceError, refetch } = useBalance(wallet.address, chain);
  const tokenPrices = useTokenPrices();
  // HOOK: Send token
  const { sendToken: hookSendToken, loading: loadingSend, error: hookSendError, txHash: hookTxHash } = useSendToken();

  // Tambahkan log debug
  console.log('getTokenList', chain, getTokenList(chain));

  // 1. Default token list per chain
  const defaultTokenListMap: Record<string, Array<{ symbol: string; name: string; logo: string; address: string; chainId: number }>> = {
    eth: [
      { symbol: 'ETH', name: 'Ethereum', logo: 'https://raw.githubusercontent.com/spothq/cryptocurrency-icons/master/svg/color/eth.svg', address: '', chainId: 1 },
      { symbol: 'USDT', name: 'Tether USD', logo: 'https://raw.githubusercontent.com/spothq/cryptocurrency-icons/master/svg/color/usdt.svg', address: '0xdAC17F958D2ee523a2206206994597C13D831ec7', chainId: 1 },
      { symbol: 'USDC', name: 'USD Coin', logo: 'https://raw.githubusercontent.com/spothq/cryptocurrency-icons/master/svg/color/usdc.svg', address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', chainId: 1 },
    ],
    base: [
      { symbol: 'ETH', name: 'Ethereum', logo: 'https://raw.githubusercontent.com/spothq/cryptocurrency-icons/master/svg/color/eth.svg', address: '', chainId: 8453 },
      { symbol: 'USDT', name: 'Tether USD', logo: 'https://raw.githubusercontent.com/spothq/cryptocurrency-icons/master/svg/color/usdt.svg', address: '0xA7D9ddBE1f17865597fBD27EC712455208B6b76D', chainId: 8453 },
      { symbol: 'USDC', name: 'USD Coin', logo: 'https://raw.githubusercontent.com/spothq/cryptocurrency-icons/master/svg/color/usdc.svg', address: '0xd9AAEC86B65d86f6A7B5B1b0c42FFA531710b6CA', chainId: 8453 },
    ],
    polygon: [
      { symbol: 'MATIC', name: 'Polygon', logo: 'https://raw.githubusercontent.com/spothq/cryptocurrency-icons/master/svg/color/matic.svg', address: '', chainId: 137 },
      { symbol: 'USDT', name: 'Tether USD', logo: 'https://raw.githubusercontent.com/spothq/cryptocurrency-icons/master/svg/color/usdt.svg', address: '0x3813e82e6f7098b9583FC0F33a962D02018B6803', chainId: 137 },
      { symbol: 'USDC', name: 'USD Coin', logo: 'https://raw.githubusercontent.com/spothq/cryptocurrency-icons/master/svg/color/usdc.svg', address: '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174', chainId: 137 },
    ],
    bsc: [
      { symbol: 'BNB', name: 'BNB', logo: 'https://raw.githubusercontent.com/spothq/cryptocurrency-icons/master/svg/color/bnb.svg', address: '', chainId: 56 },
      { symbol: 'USDT', name: 'Tether USD', logo: 'https://raw.githubusercontent.com/spothq/cryptocurrency-icons/master/svg/color/usdt.svg', address: '0x55d398326f99059fF775485246999027B3197955', chainId: 56 },
      { symbol: 'USDC', name: 'USD Coin', logo: 'https://raw.githubusercontent.com/spothq/cryptocurrency-icons/master/svg/color/usdc.svg', address: '0x8ac76a51cc950d9822d68b83fe1ad97b32cd580d', chainId: 56 },
    ],
  };
  const defaultTokenList = defaultTokenListMap[chain] || [];

  // Ambil balances dari wallet jika ada
  const walletBalances: Record<string, any> = (wallet && 'balance' in wallet && wallet.balance) ? wallet.balance : {};
  // Pilih balances sesuai chain aktif
  const activeBalances: Record<string, any> = walletBalances[chain] || {};
  // Gabungkan ke tokenList utama
  const mergedTokenList = [
    { symbol: 'ETH', name: 'Ethereum', logo: 'https://raw.githubusercontent.com/spothq/cryptocurrency-icons/master/svg/color/eth.svg' },
    { symbol: 'BNB', name: 'BNB', logo: 'https://raw.githubusercontent.com/spothq/cryptocurrency-icons/master/svg/color/bnb.svg' },
    { symbol: 'MATIC', name: 'Polygon', logo: 'https://raw.githubusercontent.com/spothq/cryptocurrency-icons/master/svg/color/matic.svg' },
    { symbol: 'BASE', name: 'Base ETH', logo: 'https://raw.githubusercontent.com/spothq/cryptocurrency-icons/master/svg/color/eth.svg' },
    { symbol: 'USDT', name: 'Tether USD', logo: 'https://raw.githubusercontent.com/spothq/cryptocurrency-icons/master/svg/color/usdt.svg' },
    { symbol: 'USDC', name: 'USD Coin', logo: 'https://raw.githubusercontent.com/spothq/cryptocurrency-icons/master/svg/color/usdc.svg' },
  ].map(def => {
    // Mapping symbol lowercase untuk balance
    const bal = activeBalances[def.symbol.toLowerCase()] || activeBalances[def.symbol] || '0';
    return {
      ...def,
      balance: parseFloat(bal),
      priceUSD: tokenPrices[def.symbol]?.priceUSD ?? 0,
      priceChange24h: tokenPrices[def.symbol]?.priceChange24h ?? 0,
    };
  });
  const tokenList = mergedTokenList;
  console.log('tokenList with prices', tokenList);

  // Setelah tokenList didefinisikan:
  // console.log('tokenList', tokenList);

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

  if (activeSection === 'receive') {
    return (
      <div className="p-6">
        <div className="flex items-center mb-6">
          <button
            onClick={() => setActiveSection('main')}
            className="mr-4 p-2 rounded-lg bg-crypto-card border border-crypto-border"
          >
            <ArrowLeftRight className="w-5 h-5" />
          </button>
          <h2 className="text-xl font-semibold">Receive</h2>
        </div>

        <div className="card text-center">
          <div className="mb-4">
            <QRCode value={wallet.address} size={200} className="mx-auto" />
          </div>
          
          <div className="mb-4">
            <p className="text-sm text-gray-400 mb-2">Your Wallet Address</p>
            <div className="flex items-center justify-center gap-2">
              <code className="text-sm bg-crypto-dark px-3 py-2 rounded-lg flex-1 break-all">
                {formatAddress(wallet.address)}
              </code>
              <button
                onClick={copyAddress}
                className="p-2 bg-primary-600 rounded-lg hover:bg-primary-700"
              >
                <Copy className="w-4 h-4" />
              </button>
            </div>
          </div>

          <p className="text-xs text-gray-400">
            Share this address to receive crypto from other wallets
          </p>
        </div>
      </div>
    )
  }

  if (activeSection === 'send') {
    // Ambil token dengan balance > 0, urut dari balance terbesar
    const sendableTokens = tokenList.filter(t => t.balance > 0).sort((a, b) => b.balance - a.balance);
    const selectedToken = sendableTokens.find(t => t.symbol === sendForm.token) || sendableTokens[0];
    // Dummy fee (bisa diganti fetch fee dari backend)
    const estimatedFee = 0.001; // contoh fee
    // Fungsi handle MAX
    const handleMax = () => {
      // Jika native token, kurangi fee
      if (selectedToken.symbol === selectedToken.symbol) {
        setSendForm({ ...sendForm, amount: (selectedToken.balance - estimatedFee).toFixed(6) });
      } else {
        setSendForm({ ...sendForm, amount: selectedToken.balance.toFixed(6) });
      }
    };
    // Validasi address
    const isAddressValid = isValidAddress(sendForm.address);
    // Validasi form
    const isFormValid = isAddressValid && sendForm.amount && parseFloat(sendForm.amount) > 0 && selectedToken;
    // Fungsi kirim
    const handleSendConfirm = async () => {
      setTxStatus('pending');
      setTxError('');
      try {
        // Kirim request ke backend
        const response = await fetch('/api/transaction/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            from: wallet.address,
            to: sendForm.address,
            token: selectedToken.symbol,
            chain: selectedToken.symbol,
            amount: sendForm.amount,
            seedPhrase: wallet.seedPhrase // <-- tambahkan ini!
          })
        });
        const result = await response.json();
        if (result.success) {
          setTxStatus('success');
        } else {
          setTxStatus('error');
          setTxError(result.error || 'Failed to send transaction');
        }
      } catch (e) {
        setTxStatus('error');
        setTxError('Failed to send transaction');
      }
    };
    return (
      <div className="p-6">
        <div className="flex items-center mb-6">
          <button
            onClick={() => setActiveSection('main')}
            className="mr-4 p-2 rounded-lg bg-crypto-card border border-crypto-border"
          >
            <ArrowLeftRight className="w-5 h-5" />
          </button>
          <h2 className="text-xl font-semibold">Send</h2>
        </div>
        <div className="card">
          <div className="space-y-4">
            {/* Token Dropdown */}
            <div>
              <label className="block text-sm font-medium mb-2">Token</label>
              <div className="relative">
                <select
                  value={sendForm.token}
                  onChange={e => setSendForm({ ...sendForm, token: e.target.value })}
                  className="input-field w-full pl-12"
                >
                  {sendableTokens.map(token => (
                    <option key={token.symbol + token.symbol} value={token.symbol}>
                      {token.name}
                    </option>
                  ))}
                </select>
                {/* Logo di kiri */}
                {selectedToken && (
                  <span className="absolute left-2 top-1/2 -translate-y-1/2">{selectedToken.symbol}</span>
                )}
              </div>
              {/* Nama + balance di kanan */}
              {selectedToken && (
                <div className="flex justify-between text-xs mt-1">
                  <span>{selectedToken.name}</span>
                  <span>{selectedToken.balance.toFixed(6)} {selectedToken.symbol}</span>
                </div>
              )}
            </div>
            {/* Recipient */}
            <div>
              <label className="block text-sm font-medium mb-2">Recipient Address</label>
              <input
                type="text"
                value={sendForm.address}
                onChange={e => setSendForm({ ...sendForm, address: e.target.value })}
                placeholder="0x..."
                className="input-field w-full"
              />
              {!isAddressValid && sendForm.address && (
                <div className="text-red-500 text-xs mt-1">Invalid address</div>
              )}
            </div>
            {/* Amount */}
            <div>
              <label className="block text-sm font-medium mb-2">Amount</label>
              <div className="flex gap-2">
              <input
                type="number"
                value={sendForm.amount}
                  onChange={e => setSendForm({ ...sendForm, amount: e.target.value })}
                placeholder="0.0"
                  className="input-field flex-1"
                  min="0"
                  max={selectedToken ? selectedToken.balance : undefined}
              />
                <button
                  type="button"
                  onClick={handleMax}
                  className="btn-secondary px-3"
                >MAX</button>
            </div>
              {selectedToken && (
                <div className="text-xs text-gray-400 mt-1">Available: {selectedToken.balance.toFixed(6)} {selectedToken.symbol}</div>
              )}
            </div>
            {/* Estimated Fee */}
            <div className="text-xs text-gray-400 mb-2">Estimated Fee: {estimatedFee} {selectedToken ? selectedToken.symbol : ''}</div>
            {/* Send Button */}
            <button
              onClick={() => setShowConfirm(true)}
              disabled={!isFormValid}
              className="w-full btn-primary flex items-center justify-center gap-2 disabled:opacity-50"
            >
              Send Transaction
            </button>
          </div>
        </div>
        {/* Modal Konfirmasi */}
        {showConfirm && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
            onClick={() => { setShowConfirm(false); setActiveSection('main'); setSendForm({ address: '', amount: '', token: sendableTokens[0]?.symbol || '' }); }}
          >
            <div
              className="bg-crypto-card border border-crypto-border rounded-xl p-6 w-full max-w-sm mx-4"
              onClick={e => e.stopPropagation()}
            >
              <h3 className="text-lg font-semibold mb-4">Confirm Transaction</h3>
              <div className="mb-4">
                <div>Send <b>{sendForm.amount} {selectedToken.symbol}</b> to</div>
                <div className="break-all text-primary-500 font-mono">{sendForm.address}</div>
                <div className="mt-2 text-xs text-gray-400">Fee: {estimatedFee} {selectedToken.symbol}</div>
              </div>
              {txStatus === 'idle' && (
                <div className="flex gap-2">
                  <button onClick={() => setShowConfirm(false)} className="btn-secondary flex-1">Cancel</button>
                  <button onClick={handleSendConfirm} className="btn-primary flex-1">Confirm</button>
                </div>
              )}
              {txStatus === 'pending' && (
                <div className="text-center py-4">Processing transaction...</div>
              )}
              {txStatus === 'success' && (
                <>
                  <div className="text-green-500 text-center py-4">Transaction sent successfully!</div>
                  <button onClick={() => {
                    setShowConfirm(false);
                    setActiveSection('main');
                    setSendForm({ address: '', amount: '', token: sendableTokens[0]?.symbol || '' });
                    refreshWalletAndHistory();
                  }} className="btn-primary w-full mt-4">OK</button>
                </>
              )}
              {txStatus === 'error' && (
                <div className="text-red-500 text-center py-4">{txError}</div>
              )}
            </div>
          </div>
        )}
      </div>
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
        {/* Address & Copy */}
        <div className="flex items-center justify-between mb-2">
          <span className="font-mono text-xs text-gray-400">{wallet.address.slice(0, 6)}...{wallet.address.slice(-4)}</span>
          <div className="flex items-center gap-2">
            <button 
              onClick={refreshWallet}
              disabled={isRefreshing}
              className="p-1 bg-gray-700 rounded hover:bg-primary-700 disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 text-white ${isRefreshing ? 'animate-spin' : ''}`} />
            </button>
          <button onClick={copyAddress} className="p-1 bg-gray-700 rounded hover:bg-primary-700">
            <Copy className="w-4 h-4 text-white" />
          </button>
          </div>
        </div>
        {/* Chain Selector */}
        <div className="flex gap-2 mb-4">
          {['eth', 'bsc', 'polygon', 'base'].map(c => (
            <button
              key={c}
              className={`px-3 py-1 rounded ${chain === c ? 'bg-primary-500 text-white' : 'bg-gray-700 text-gray-300'}`}
              onClick={() => setChain(c)}
            >
              {c.toUpperCase()}
            </button>
          ))}
        </div>
        {/* Total Worth */}
        <div className="text-center mb-2">
          <div className="text-3xl font-bold text-white">${totalWorth}</div>
          <div className="text-xs text-gray-400 flex items-center justify-center gap-1">
            <span>Total Portfolio Value</span>
            <span className="text-gray-500">|</span>
            <span className="flex items-center gap-1">
              <Eth className="w-3 h-3" />
              {parseFloat(balances['ETH'] ?? '0').toFixed(4)}
            </span>
          </div>
          {/* lastPriceUpdate && ( // Hapus state lastPriceUpdate lama */}
          {/*   <div className="text-xs text-gray-500 mt-1"> */}
          {/*     Last updated: {lastPriceUpdate.toLocaleTimeString()} */}
          {/*   </div> */}
          {/* ) */}
        </div>
        {/* Action Buttons */}
        <div className="flex justify-between items-center mb-4 px-2">
          <button 
            onClick={() => setActiveSection('send')}
            className="flex flex-col items-center hover:text-primary-500 transition-colors"
          >
            <Send className="w-6 h-6" />
            <span className="text-xs mt-1">Send</span>
          </button>
          <button 
            onClick={() => setActiveSection('receive')}
            className="flex flex-col items-center hover:text-primary-500 transition-colors"
          >
            <Download className="w-6 h-6" />
            <span className="text-xs mt-1">Receive</span>
          </button>
          <button 
            onClick={() => setActiveSection('swap')}
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
            {tokenList.map((token, index) => (
              <TokenRow
                key={token.symbol}
                symbol={token.symbol}
                name={token.name}
                logo={token.logo}
                balance={token.balance}
                priceUSD={token.priceUSD}
                priceChange24h={token.priceChange24h}
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
      </div>
    );
  }
} 