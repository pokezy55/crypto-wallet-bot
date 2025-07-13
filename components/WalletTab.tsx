'use client'

import { useState } from 'react'
import { Send, Download, ArrowLeftRight, Copy, QrCode, Plus, Settings, RefreshCw } from 'lucide-react'
import toast from 'react-hot-toast'
import QRCode from 'qrcode.react'
import { formatAddress, isValidAddress } from '@/lib/address'
import { Eth, Bnb, Polygon, Base } from './TokenIcons';

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
  balance: {
    eth: string
    usdt: string
    base?: string;
    pol?: string;
    bnb?: string;
  }
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
  const [activeTab, setActiveTab] = useState<'token' | 'nft' | 'tools'>('token');
  const [sendError, setSendError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  // Token list dengan data dummy untuk demo
  const tokenList = [
    { 
      symbol: 'ETH', 
      name: 'Ethereum', 
      icon: <Eth />, 
      price: 1800, 
      change: 2.5, 
      amount: parseFloat(wallet.balance.eth || '0'), 
      fiat: parseFloat(wallet.balance.eth || '0') * 1800 
    },
    { 
      symbol: 'USDT', 
      name: 'Tether', 
      icon: <Eth />, 
      price: 1.0, 
      change: 0.0, 
      amount: parseFloat(wallet.balance.usdt || '0'), 
      fiat: parseFloat(wallet.balance.usdt || '0') 
    },
    { 
      symbol: 'BNB', 
      name: 'Binance Coin', 
      icon: <Bnb />, 
      price: 240, 
      change: -1.2, 
      amount: parseFloat(wallet.balance.bnb || '0'), 
      fiat: parseFloat(wallet.balance.bnb || '0') * 240 
    },
    { 
      symbol: 'POL', 
      name: 'Polygon', 
      icon: <Polygon />, 
      price: 0.24, 
      change: -2.62, 
      amount: parseFloat(wallet.balance.pol || '0'), 
      fiat: parseFloat(wallet.balance.pol || '0') * 0.24 
    },
    { 
      symbol: 'BASE', 
      name: 'Base', 
      icon: <Base />, 
      price: 0.15, 
      change: 5.8, 
      amount: parseFloat(wallet.balance.base || '0'), 
      fiat: parseFloat(wallet.balance.base || '0') * 0.15 
    }
  ];

  // Calculate total worth
  const totalWorth = tokenList.reduce((sum, token) => sum + token.fiat, 0).toFixed(2);

  const refreshWallet = async () => {
    setIsRefreshing(true);
    try {
      // Simulate refresh delay
      await new Promise(resolve => setTimeout(resolve, 1500));
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
            <div>
              <label className="block text-sm font-medium mb-2">Recipient Address</label>
              <input
                type="text"
                value={sendForm.address}
                onChange={(e) => setSendForm({ ...sendForm, address: e.target.value })}
                placeholder="0x..."
                className="input-field w-full"
              />
              {sendError && <div className="text-red-500 text-xs mt-1">{sendError}</div>}
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Amount</label>
              <input
                type="number"
                value={sendForm.amount}
                onChange={(e) => setSendForm({ ...sendForm, amount: e.target.value })}
                placeholder="0.0"
                className="input-field w-full"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Token</label>
              <select
                value={sendForm.token}
                onChange={(e) => setSendForm({ ...sendForm, token: e.target.value })}
                className="input-field w-full"
              >
                <option value="ETH">ETH</option>
                <option value="USDT">USDT</option>
                <option value="BNB">BNB</option>
                <option value="POL">POL</option>
                <option value="BASE">BASE</option>
              </select>
            </div>

            <button
              onClick={handleSend}
              disabled={isLoading}
              className="w-full btn-primary flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Processing...
                </>
              ) : (
                'Send Transaction'
              )}
            </button>
          </div>
        </div>
      </div>
    )
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
                  <option value="POL">POL</option>
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
                  <option value="POL">POL</option>
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
              {parseFloat(wallet.balance.eth || '0').toFixed(4)}
            </span>
          </div>
        </div>
        {/* Action Buttons */}
        <div className="flex justify-between items-center mb-4 px-2">
          <button 
            onClick={() => setActiveSection('send')}
            className="flex flex-col items-center hover:text-primary-500 transition-colors"
          >
            <Send className="w-6 h-6" />
            <span className="text-xs mt-1">Kirim</span>
          </button>
          <button 
            onClick={() => setActiveSection('receive')}
            className="flex flex-col items-center hover:text-primary-500 transition-colors"
          >
            <Download className="w-6 h-6" />
            <span className="text-xs mt-1">Terima</span>
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
            <span className="text-xs mt-1">Tambah</span>
          </button>
          <button 
            onClick={() => setActiveTab('tools')}
            className="flex flex-col items-center hover:text-primary-500 transition-colors"
          >
            <Copy className="w-6 h-6" />
            <span className="text-xs mt-1">Riwayat</span>
          </button>
        </div>
        {/* Tab Token/NFT/Alat */}
        <div className="flex gap-4 border-b border-gray-700 mb-2">
          <button className={`pb-2 px-2 text-sm ${activeTab === 'token' ? 'border-b-2 border-primary-500 text-white' : 'text-gray-400'}`} onClick={() => setActiveTab('token')}>Token</button>
          <button className={`pb-2 px-2 text-sm ${activeTab === 'nft' ? 'border-b-2 border-primary-500 text-white' : 'text-gray-400'}`} onClick={() => setActiveTab('nft')}>NFT</button>
          <button className={`pb-2 px-2 text-sm ${activeTab === 'tools' ? 'border-b-2 border-primary-500 text-white' : 'text-gray-400'}`} onClick={() => setActiveTab('tools')}>Alat</button>
        </div>
        {/* Token List */}
        {activeTab === 'token' && (
          <div className="flex flex-col gap-3 mt-2">
            {tokenList.map((token, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-crypto-card rounded-lg border border-crypto-border">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 flex items-center justify-center">
                    {token.icon}
                  </div>
                  <div>
                    <div className="font-medium text-white">{token.symbol}</div>
                    <div className="text-xs text-gray-400">{token.name}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-medium text-white">
                    {token.amount > 0 ? token.amount.toFixed(6) : '0.000000'}
                  </div>
                  <div className="text-xs text-gray-400">
                    ${token.fiat > 0 ? token.fiat.toFixed(2) : '0.00'}
                  </div>
                  <div className={`text-xs ${token.change >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {token.change >= 0 ? '+' : ''}{token.change}%
                  </div>
                </div>
              </div>
            ))}
            {tokenList.length === 0 && (
              <div className="text-center text-gray-500 py-8">No tokens found</div>
            )}
          </div>
        )}
        {/* NFT & Tools tab */}
        {activeTab === 'nft' && (
          <div className="text-center text-gray-500 py-8">
            <div className="mb-4">
              <QrCode className="w-16 h-16 mx-auto text-gray-600" />
            </div>
            <p>No NFTs in this wallet</p>
            <p className="text-sm mt-2">Your NFT collection will appear here</p>
          </div>
        )}
        {activeTab === 'tools' && (
          <div className="space-y-3 mt-2">
            <div className="p-3 bg-crypto-card rounded-lg border border-crypto-border">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <QrCode className="w-6 h-6 text-primary-500" />
                  <div>
                    <div className="font-medium text-white">Export Private Key</div>
                    <div className="text-xs text-gray-400">Backup your wallet</div>
                  </div>
                </div>
                <button className="text-primary-500 text-sm">Export</button>
              </div>
            </div>
            <div className="p-3 bg-crypto-card rounded-lg border border-crypto-border">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Copy className="w-6 h-6 text-primary-500" />
                  <div>
                    <div className="font-medium text-white">Transaction History</div>
                    <div className="text-xs text-gray-400">View all transactions</div>
                  </div>
                </div>
                <button className="text-primary-500 text-sm">View</button>
              </div>
            </div>
            <div className="p-3 bg-crypto-card rounded-lg border border-crypto-border">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Settings className="w-6 h-6 text-primary-500" />
                  <div>
                    <div className="font-medium text-white">Wallet Settings</div>
                    <div className="text-xs text-gray-400">Configure your wallet</div>
                  </div>
                </div>
                <button className="text-primary-500 text-sm">Settings</button>
              </div>
            </div>
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