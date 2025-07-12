'use client'

import { useState } from 'react'
import { Send, Download, ArrowLeftRight, Copy, QrCode } from 'lucide-react'
import toast from 'react-hot-toast'
import QRCode from 'qrcode.react'

interface User {
  id: number
  first_name: string
  last_name?: string
  username?: string
  photo_url?: string
}

interface Wallet {
  address: string
  balance: {
    eth: string
    usdt: string
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

  const copyAddress = () => {
    navigator.clipboard.writeText(wallet.address)
    toast.success('Address copied to clipboard!')
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
                {wallet.address}
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

  return (
    <div className="p-6">
      {/* Balance Card */}
      <div className="card mb-6">
        <h2 className="text-lg font-semibold mb-4">Wallet Balance</h2>
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-gray-400">ETH</span>
            <span className="font-semibold">{wallet.balance.eth}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-400">USDT</span>
            <span className="font-semibold">${wallet.balance.usdt}</span>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <button
          onClick={() => setActiveSection('receive')}
          className="card text-center py-4 hover:bg-crypto-border transition-colors"
        >
          <Download className="w-8 h-8 mx-auto mb-2 text-primary-500" />
          <span className="text-sm">Receive</span>
        </button>
        
        <button
          onClick={() => setActiveSection('send')}
          className="card text-center py-4 hover:bg-crypto-border transition-colors"
        >
          <Send className="w-8 h-8 mx-auto mb-2 text-primary-500" />
          <span className="text-sm">Send</span>
        </button>
        
        <button
          onClick={() => setActiveSection('swap')}
          className="card text-center py-4 hover:bg-crypto-border transition-colors"
        >
          <ArrowLeftRight className="w-8 h-8 mx-auto mb-2 text-primary-500" />
          <span className="text-sm">Swap</span>
        </button>
      </div>

      {/* Wallet Address */}
      <div className="card">
        <h3 className="text-sm font-medium mb-3">Wallet Address</h3>
        <div className="flex items-center gap-2">
          <code className="text-sm bg-crypto-dark px-3 py-2 rounded-lg flex-1 break-all">
            {wallet.address}
          </code>
          <button
            onClick={copyAddress}
            className="p-2 bg-primary-600 rounded-lg hover:bg-primary-700"
          >
            <Copy className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )
} 