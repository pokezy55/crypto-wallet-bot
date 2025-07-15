'use client'

import { useState, useEffect } from 'react'
import { Send, Download, ArrowLeftRight, Copy, QrCode, Plus, Settings, RefreshCw, ExternalLink } from 'lucide-react'
import toast from 'react-hot-toast'
import QRCode from 'qrcode.react'
import { formatAddress, isValidAddress } from '@/lib/address'
import { getCachedTokenPrices } from '@/lib/crypto-prices'
import { Eth, Bnb, Pol, Base, Usdt } from './TokenIcons';
import { useRef } from 'react';

interface User {
  id: number
  first_name: string
  last_name?: string
  username?: string
  photo_url?: string
}

interface Wallet {
  id: string;
  address: string;
  balance: Record<string, Record<string, string>>;
  seedPhrase?: string;
  createdAt?: string;
  updatedAt?: string;
}

interface WalletTabProps {
  wallet: Wallet
  user: User
}

export default function WalletTab({ wallet, user }: WalletTabProps) {
  const [activeSection, setActiveSection] = useState<'main' | 'receive' | 'send' | 'swap'>('main')
  const [sendForm, setSendForm] = useState({
    address: '',
    amount: '',
    token: 'ETH'
  })
  const [swapForm, setSwapForm] = useState({
    fromToken: 'ETH',
    toToken: 'USDT',
    amount: ''
  })
  const [showAddToken, setShowAddToken] = useState(false);
  const [newToken, setNewToken] = useState({ network: 'ETH', contract: '' });
  const [customTokens, setCustomTokens] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'token' | 'history'>('token');
  const [history, setHistory] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [sendError, setSendError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [tokenPrices, setTokenPrices] = useState<Record<string, { price: number; change24h: number; lastUpdated: number }>>({});
  const [lastPriceUpdate, setLastPriceUpdate] = useState<Date | null>(null);
  // Token list dengan data real-time
  // Default chain: Ethereum (eth)
  const chain = 'eth';
  // Helper untuk ambil balance dari beberapa chain
  function getTokenBalance(wallet: Wallet, chain: string, tokenKey: string): number {
    const val = parseFloat(wallet.balance?.[chain]?.[tokenKey] ?? '0');
    if (!isNaN(val) && val > 0) return val;
    return 0;
  }

  // Daftar token multi-chain
  const tokenMeta = [
    { symbol: 'ETH', name: 'ETH', chain: 'eth', tokenKey: 'eth', decimals: 18 },
    { symbol: 'USDT', name: 'USDT', chain: 'eth', tokenKey: 'usdt', decimals: 6 },
    { symbol: 'USDC', name: 'USDC', chain: 'eth', tokenKey: 'usdc', decimals: 6 },
    { symbol: 'BNB', name: 'BNB', chain: 'bsc', tokenKey: 'bnb', decimals: 18 },
    { symbol: 'USDT', name: 'USDT', chain: 'bsc', tokenKey: 'usdt', decimals: 6 },
    { symbol: 'USDC', name: 'USDC', chain: 'bsc', tokenKey: 'usdc', decimals: 6 },
    { symbol: 'POLYGON', name: 'POL', chain: 'polygon', tokenKey: 'pol', decimals: 18 },
    { symbol: 'USDT', name: 'USDT', chain: 'polygon', tokenKey: 'usdt', decimals: 6 },
    { symbol: 'USDC', name: 'USDC', chain: 'polygon', tokenKey: 'usdc', decimals: 6 },
    { symbol: 'BASE', name: 'ETH', chain: 'base', tokenKey: 'base', decimals: 18 },
    { symbol: 'USDT', name: 'USDT', chain: 'base', tokenKey: 'usdt', decimals: 6 },
    { symbol: 'USDC', name: 'USDC', chain: 'base', tokenKey: 'usdc', decimals: 6 },
  ];

  // Mapping harga
  const priceMap: Record<string, number> = {
    ETH: tokenPrices.ETH?.price || 1850.45,
    USDT: tokenPrices.USDT?.price || 1.0,
    USDC: tokenPrices.USDC?.price || 1.0,
    BNB: tokenPrices.BNB?.price || 245.67,
    POLYGON: tokenPrices.POLYGON?.price || 0.234,
    BASE: tokenPrices.ETH?.price || 0.152, // Base pakai harga ETH
  };
  // Mapping perubahan harga
  const priceMapChange: Record<string, number> = {
    ETH: tokenPrices.ETH?.change24h || 0,
    USDT: tokenPrices.USDT?.change24h || 0,
    USDC: tokenPrices.USDC?.change24h || 0,
    BNB: tokenPrices.BNB?.change24h || 0,
    POLYGON: tokenPrices.POLYGON?.change24h || 0,
    BASE: tokenPrices.ETH?.change24h || 0,
  };

  // Token list dinamis
  let tokenList = tokenMeta.map(meta => {
    const amount = getTokenBalance(wallet, meta.chain, meta.tokenKey);
    return {
      symbol: meta.symbol,
      name: meta.name,
      chain: meta.chain,
      icon: meta.symbol === 'ETH'
        ? <img src="https://raw.githubusercontent.com/spothq/cryptocurrency-icons/master/svg/color/eth.svg" alt="ETH" className="w-8 h-8 rounded-full" />
        : meta.symbol === 'BNB'
        ? <img src="https://raw.githubusercontent.com/spothq/cryptocurrency-icons/master/svg/color/bnb.svg" alt="BNB" className="w-8 h-8 rounded-full" />
        : meta.symbol === 'POLYGON'
        ? <img src="https://raw.githubusercontent.com/spothq/cryptocurrency-icons/master/svg/color/matic.svg" alt="POLYGON" className="w-8 h-8 rounded-full" />
        : meta.symbol === 'BASE'
        ? <img src="https://raw.githubusercontent.com/spothq/cryptocurrency-icons/master/svg/color/eth.svg" alt="BASE" className="w-8 h-8 rounded-full" />
        : meta.symbol === 'USDT'
        ? <img src="https://raw.githubusercontent.com/spothq/cryptocurrency-icons/master/svg/color/usdt.svg" alt="USDT" className="w-8 h-8 rounded-full" />
        : meta.symbol === 'USDC'
        ? <img src="https://raw.githubusercontent.com/spothq/cryptocurrency-icons/master/svg/color/usdc.svg" alt="USDC" className="w-8 h-8 rounded-full" />
        : <img src="https://raw.githubusercontent.com/spothq/cryptocurrency-icons/master/svg/color/eth.svg" alt="ETH" className="w-8 h-8 rounded-full" />,
      price: priceMap[meta.symbol] || 1.0,
      change: priceMapChange[meta.symbol] || 0,
      amount,
      fiat: amount * (priceMap[meta.symbol] || 1.0),
    };
  });
  // Urutkan token dengan saldo > 0 ke paling atas
  const sortedTokenList = [
    ...tokenList.filter(t => t.amount > 0),
    ...tokenList.filter(t => t.amount === 0),
  ];

  // Calculate total worth
  const totalWorth = sortedTokenList.reduce((sum, token) => sum + token.fiat, 0).toFixed(2);

  // Fetch real-time token prices
  useEffect(() => {
    const fetchPrices = async () => {
      try {
        const prices = await getCachedTokenPrices();
        setTokenPrices(prices);
        setLastPriceUpdate(new Date());
      } catch (error) {
        console.error('Error fetching prices:', error);
      }
    };

    fetchPrices();
    
    // Refresh prices every 30 seconds
    const interval = setInterval(fetchPrices, 30000);
    
    return () => clearInterval(interval);
  }, []);

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
      setTokenPrices(prices);
      setLastPriceUpdate(new Date());
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
    setSendError('');
    setIsLoading(true);
    
    if (!sendForm.address || !sendForm.amount) {
      setSendError('Please fill in all fields');
      toast.error('Please fill in all fields');
      setIsLoading(false);
      return;
    }
    if (!isValidAddress(sendForm.address)) {
      setSendError('Wrong address format');
      toast.error('Wrong address format');
      setIsLoading(false);
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
      setIsLoading(false);
    }
  }

  const handleSwap = async () => {
    if (!swapForm.amount) {
      toast.error('Please enter amount')
      return
    }
    
    setIsLoading(true);
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
      setIsLoading(false);
    }
  }

  const [showConfirm, setShowConfirm] = useState(false);
  const [txStatus, setTxStatus] = useState<'idle' | 'pending' | 'success' | 'error'>('idle');
  const [txError, setTxError] = useState('');
  const confirmRef = useRef(null);

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
    const sendableTokens = sortedTokenList.filter(t => t.amount > 0).sort((a, b) => b.amount - a.amount);
    const selectedToken = sendableTokens.find(t => t.symbol === sendForm.token) || sendableTokens[0];
    // Dummy fee (bisa diganti fetch fee dari backend)
    const estimatedFee = 0.001; // contoh fee
    // Fungsi handle MAX
    const handleMax = () => {
      // Jika native token, kurangi fee
      if (selectedToken.symbol === selectedToken.chain) {
        setSendForm({ ...sendForm, amount: (selectedToken.amount - estimatedFee).toFixed(6) });
      } else {
        setSendForm({ ...sendForm, amount: selectedToken.amount.toFixed(6) });
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
        // Simulasi API call
        await new Promise(r => setTimeout(r, 2000));
        setTxStatus('success');
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
                    <option key={token.symbol + token.chain} value={token.symbol}>
                      {token.name}
                    </option>
                  ))}
                </select>
                {/* Logo di kiri */}
                {selectedToken && (
                  <span className="absolute left-2 top-1/2 -translate-y-1/2">{selectedToken.icon}</span>
                )}
              </div>
              {/* Nama + balance di kanan */}
              {selectedToken && (
                <div className="flex justify-between text-xs mt-1">
                  <span>{selectedToken.name}</span>
                  <span>{selectedToken.amount.toFixed(6)} {selectedToken.symbol}</span>
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
                  max={selectedToken ? selectedToken.amount : undefined}
                />
                <button
                  type="button"
                  onClick={handleMax}
                  className="btn-secondary px-3"
                >MAX</button>
              </div>
              {selectedToken && (
                <div className="text-xs text-gray-400 mt-1">Available: {selectedToken.amount.toFixed(6)} {selectedToken.symbol}</div>
              )}
            </div>
            {/* Estimated Fee */}
            <div className="text-xs text-gray-400 mb-2">Estimated Fee: {estimatedFee} {selectedToken ? selectedToken.chain : ''}</div>
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
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-crypto-card border border-crypto-border rounded-xl p-6 w-full max-w-sm mx-4">
              <h3 className="text-lg font-semibold mb-4">Confirm Transaction</h3>
              <div className="mb-4">
                <div>Send <b>{sendForm.amount} {selectedToken.symbol}</b> to</div>
                <div className="break-all text-primary-500 font-mono">{sendForm.address}</div>
                <div className="mt-2 text-xs text-gray-400">Fee: {estimatedFee} {selectedToken.chain}</div>
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
                <div className="text-green-500 text-center py-4">Transaction sent successfully!</div>
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
              disabled={isLoading}
              className="w-full btn-primary flex items-center justify-center gap-2"
            >
              {isLoading ? (
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
        {/* Total Worth */}
        <div className="text-center mb-2">
          <div className="text-3xl font-bold text-white">${totalWorth}</div>
          <div className="text-xs text-gray-400 flex items-center justify-center gap-1">
            <span>Total Portfolio Value</span>
            <span className="text-gray-500">|</span>
            <span className="flex items-center gap-1">
              <Eth className="w-3 h-3" />
              {parseFloat(wallet.balance?.eth?.eth ?? '0').toFixed(4)}
            </span>
          </div>
          {lastPriceUpdate && (
            <div className="text-xs text-gray-500 mt-1">
              Last updated: {lastPriceUpdate.toLocaleTimeString()}
            </div>
          )}
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
            {sortedTokenList.map((token, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-crypto-card rounded-lg border border-crypto-border">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 flex items-center justify-center">
                    {token.icon}
                  </div>
                  <div>
                    <div className="font-medium text-white">{token.name}</div>
                    <div className="text-xs text-gray-400">({token.chain.toUpperCase()})</div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-300">${token.price.toLocaleString()}</span>
                      <span className={`text-xs ${token.change >= 0 ? 'text-green-400' : 'text-red-400'}`}>{token.change >= 0 ? '+' : ''}{token.change.toFixed(2)}%</span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-medium text-white">
                    {token.amount > 0 ? token.amount.toFixed(6) : '0.000000'}
                  </div>
                  <div className="text-xs text-gray-400">
                    ${token.fiat > 0 ? token.fiat.toFixed(2) : '0.00'}
                  </div>
                </div>
              </div>
            ))}
            {sortedTokenList.length === 0 && (
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
                        setCustomTokens([...customTokens, newToken]);
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