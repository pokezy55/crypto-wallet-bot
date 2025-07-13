'use client'

import { useState } from 'react'
import { Send, Download, ArrowLeftRight, Copy, QrCode } from 'lucide-react'
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

  // Dummy: total worth (replace with real API call)
  const totalWorth = 0; // TODO: hit API untuk USD worth

  const copyAddress = () => {
    if (isValidAddress(wallet.address)) {
      navigator.clipboard.writeText(wallet.address)
      toast.success('Address copied to clipboard!')
    } else {
      toast.error('Invalid wallet address!')
    }
  }

  const handleSend = async () => {
    if (!sendForm.address || !sendForm.amount) {
      toast.error('Please fill in all fields')
      return
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
      <div className="p-6">
        {/* Wallet Address */}
        <div className="flex flex-col items-center mb-4">
          <div className="flex items-center gap-2">
            <span className="font-mono text-base bg-gray-800 px-3 py-1 rounded-lg">
              {wallet.address.slice(0, 6)}...{wallet.address.slice(-4)}
            </span>
            <button onClick={copyAddress} className="p-1 bg-primary-600 rounded hover:bg-primary-700">
              <Copy className="w-4 h-4 text-white" />
            </button>
          </div>
        </div>
        {/* Total Worth */}
        <div className="text-center mb-4">
          <span className="text-gray-400 text-sm">Total Balance Worth</span>
          <div className="text-2xl font-bold text-white">${totalWorth.toLocaleString()}</div>
        </div>
        {/* Wallet Balance */}
        <div className="bg-crypto-card rounded-lg p-4 mb-4">
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Eth className="w-5 h-5" /> <span>ETH</span>
              </div>
              <span>{wallet.balance.eth || '0.0'}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Base className="w-5 h-5" /> <span>BaseETH</span>
              </div>
              <span>{wallet.balance.base || '0.0'}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Polygon className="w-5 h-5" /> <span>POL</span>
              </div>
              <span>{wallet.balance.pol || '0.0'}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bnb className="w-5 h-5" /> <span>BNB</span>
              </div>
              <span>{wallet.balance.bnb || '0.0'}</span>
            </div>
            {/* Custom tokens */}
            {customTokens.map((token, idx) => (
              <div key={idx} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span>{token.symbol}</span>
                  <span className="text-xs text-gray-400">({token.network})</span>
                </div>
                <span>{token.amount || '0.0'}</span>
              </div>
            ))}
          </div>
          <button
            className="mt-4 w-full btn-secondary"
            onClick={() => setShowAddToken(true)}
          >
            Add Other Token
          </button>
        </div>
        {/* Add Token Modal */}
        {showAddToken && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg max-w-sm w-full">
              <h3 className="text-lg font-bold mb-4">Add Custom Token</h3>
              <div className="mb-4">
                <label className="block mb-1">Network</label>
                <select
                  value={newToken.network}
                  onChange={e => setNewToken({ ...newToken, network: e.target.value })}
                  className="input-field w-full"
                >
                  <option value="ETH">ETH</option>
                  <option value="BASE">BASE</option>
                  <option value="BNB">BNB</option>
                  <option value="POL">POL</option>
                </select>
              </div>
              <div className="mb-4">
                <label className="block mb-1">Contract Address</label>
                <input
                  type="text"
                  value={newToken.contract}
                  onChange={e => setNewToken({ ...newToken, contract: e.target.value })}
                  className="input-field w-full"
                  placeholder="0x..."
                />
              </div>
              <div className="flex gap-2">
                <button
                  className="btn-primary flex-1"
                  onClick={() => {
                    // Simulasi add token
                    setCustomTokens([...customTokens, { ...newToken, symbol: 'CUSTOM', amount: '0.0' }]);
                    setShowAddToken(false);
                    setNewToken({ network: 'ETH', contract: '' });
                  }}
                >
                  Confirm Add Token
                </button>
                <button
                  className="btn-secondary flex-1"
                  onClick={() => setShowAddToken(false)}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
        {/* Menu Buttons */}
        <div className="grid grid-cols-3 gap-4 mt-4">
          <button
            className="btn-primary flex flex-col items-center gap-1"
            onClick={() => setActiveSection('receive')}
          >
            <Download className="w-5 h-5" />
            <span className="text-xs">Receive</span>
          </button>
          <button
            className="btn-primary flex flex-col items-center gap-1"
            onClick={() => setActiveSection('send')}
          >
            <Send className="w-5 h-5" />
            <span className="text-xs">Send</span>
          </button>
          <button
            className="btn-primary flex flex-col items-center gap-1"
            onClick={() => setActiveSection('swap')}
          >
            <ArrowLeftRight className="w-5 h-5" />
            <span className="text-xs">Swap</span>
          </button>
        </div>
      </div>
    );
  }
} 