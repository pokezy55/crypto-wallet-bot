'use client'

import { useState } from 'react'
import { Send, Download, ArrowLeftRight, Copy, QrCode, Plus } from 'lucide-react'
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
  // HAPUS: Dummy token list dan total worth
  // const tokenList = [
  //   { symbol: 'POL', name: 'Polygon', icon: <Polygon />, price: 0.24, change: -2.62, amount: 0.00102017, fiat: 0.24 },
  //   { symbol: 'USDT', name: 'Tether', icon: <Eth />, price: 1.0, change: 0.0, amount: 0, fiat: 0 },
  //   { symbol: 'USDC', name: 'USD Coin', icon: <Eth />, price: 1.0, change: 0.02, amount: 0, fiat: 0 },
  // ];

  // TODO: Fetch token list dan total worth dari API/backend
  const totalWorth = '0.00'; // sementara string

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
    if (!sendForm.address || !sendForm.amount) {
      setSendError('Please fill in all fields');
      toast.error('Please fill in all fields');
      return;
    }
    if (!isValidAddress(sendForm.address)) {
      setSendError('Wrong address format');
      toast.error('Wrong address format');
      return;
    }
    
    try {
      // Here you would implement the actual send logic via API
      const response = await fetch('/api/transaction/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          walletId: wallet.id,
          txType: 'send',
          toAddress: sendForm.address,
          tokenSymbol: sendForm.token,
          amount: sendForm.amount
        })
      });
      
      if (response.ok) {
        toast.success('Transaction sent!')
        setActiveSection('main')
      } else {
        toast.error('Failed to send transaction')
      }
    } catch (error) {
      toast.error('Network error')
    }
  }

  const handleSwap = () => {
    if (!swapForm.amount) {
      toast.error('Please enter amount')
      return
    }
    // Here you would implement the actual swap logic
    toast.success('Swap executed!')
    setActiveSection('main')
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
              </select>
            </div>

            <button
              onClick={handleSend}
              className="w-full btn-primary"
            >
              Send Transaction
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
                  value={swapForm.amount ? (parseFloat(swapForm.amount) * 1800).toFixed(2) : ''}
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
                </select>
              </div>
            </div>

            <button
              onClick={handleSwap}
              className="w-full btn-primary"
            >
              Swap via Uniswap
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
          <button onClick={copyAddress} className="p-1 bg-gray-700 rounded hover:bg-primary-700">
            <Copy className="w-4 h-4 text-white" />
          </button>
        </div>
        {/* Total Worth */}
        <div className="text-center mb-2">
          <div className="text-3xl font-bold text-white">${totalWorth}</div>
          <div className="text-xs text-gray-400 flex items-center justify-center gap-1">
            <span>≈ ${totalWorth}</span>
            <span className="text-gray-500">|</span>
            <span className="flex items-center gap-1"><Eth className="w-3 h-3" /> 27.50</span>
          </div>
        </div>
        {/* Action Buttons */}
        <div className="flex justify-between items-center mb-4 px-2">
          <button className="flex flex-col items-center"><Send className="w-6 h-6" /><span className="text-xs mt-1">Kirim</span></button>
          <button className="flex flex-col items-center"><Download className="w-6 h-6" /><span className="text-xs mt-1">Terima</span></button>
          <button className="flex flex-col items-center"><ArrowLeftRight className="w-6 h-6" /><span className="text-xs mt-1">Swap</span></button>
          <button className="flex flex-col items-center"><Plus className="w-6 h-6" /><span className="text-xs mt-1">Ke</span></button>
          <button className="flex flex-col items-center"><Copy className="w-6 h-6" /><span className="text-xs mt-1">Riwayat</span></button>
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
            {/* TODO: Fetch token list from API/backend */}
            <div className="text-center text-gray-500 py-8">Loading Tokens...</div>
          </div>
        )}
        {/* NFT & Tools tab kosong dulu */}
        {activeTab === 'nft' && <div className="text-center text-gray-500 py-8">No NFT</div>}
        {activeTab === 'tools' && <div className="text-center text-gray-500 py-8">No Tools</div>}
      </div>
    );
  }
} 