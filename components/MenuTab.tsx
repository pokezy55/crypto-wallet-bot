'use client'

import { useState } from 'react'
import { User, Shield, Eye, Key, MessageCircle, Copy, LogOut } from 'lucide-react'
import toast from 'react-hot-toast'
import { formatAddress, isValidAddress } from '@/lib/address'

interface User {
  id: number
  first_name: string
  last_name?: string
  username?: string
  photo_url?: string
}

interface Wallet {
  id: string;
  address: string
  balance: {
    eth: string
    usdt: string
  }
}

interface MenuTabProps {
  wallet: Wallet
  user: User
}

export default function MenuTab({ wallet, user }: MenuTabProps) {
  const [showSeedPhrase, setShowSeedPhrase] = useState(false)
  const [showPrivateKey, setShowPrivateKey] = useState(false)
  const [pin, setPin] = useState('')

  const copyAddress = () => {
    if (isValidAddress(wallet.address)) {
      navigator.clipboard.writeText(wallet.address)
      toast.success('Address copied!')
    } else {
      toast.error('Invalid wallet address!')
    }
  }

  const handleViewSeedPhrase = () => {
    if (!pin) {
      toast.error('Please enter your PIN')
      return
    }
    if (pin !== '1234') { // In real app, this would be validated against stored PIN
      toast.error('Invalid PIN')
      return
    }
    setShowSeedPhrase(true)
    setPin('')
  }

  const handleViewPrivateKey = () => {
    if (!pin) {
      toast.error('Please enter your PIN')
      return
    }
    if (pin !== '1234') {
      toast.error('Invalid PIN')
      return
    }
    setShowPrivateKey(true)
    setPin('')
  }

  const chatAdmin = () => {
    if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
      window.Telegram.WebApp.openTelegramLink('https://t.me/AdminUsername')
    } else {
      window.open('https://t.me/AdminUsername', '_blank')
    }
  }

  return (
    <div className="p-6">
      <h2 className="text-xl font-semibold mb-6">Menu</h2>

      {/* Profile Card */}
      <div className="card mb-6">
        <div className="flex items-center mb-4">
          {user.photo_url ? (
            <img
              src={user.photo_url}
              alt="Profile"
              className="w-16 h-16 rounded-full mr-4"
            />
          ) : (
            <div className="w-16 h-16 bg-primary-600 rounded-full flex items-center justify-center mr-4">
              <User className="w-8 h-8 text-white" />
            </div>
          )}
          <div className="flex-1">
            <h3 className="text-lg font-medium">
              {user.first_name} {user.last_name}
            </h3>
            {user.username && (
              <p className="text-gray-400">@{user.username}</p>
            )}
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-gray-400">Wallet Address</span>
            <div className="flex items-center gap-2">
              <code className="text-sm bg-crypto-dark px-2 py-1 rounded">
                {formatAddress(wallet.address)}
              </code>
              <button
                onClick={copyAddress}
                className="p-1 bg-primary-600 rounded hover:bg-primary-700"
              >
                <Copy className="w-3 h-3" />
              </button>
            </div>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-gray-400">ETH Balance</span>
            <span className="font-medium">{wallet.balance.eth}</span>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-gray-400">USDT Balance</span>
            <span className="font-medium">${wallet.balance.usdt}</span>
          </div>
        </div>
      </div>

      {/* Security Actions */}
      <div className="card mb-6">
        <h3 className="text-lg font-medium mb-4">Security</h3>
        <div className="space-y-3">
          <button className="w-full btn-secondary flex items-center justify-start gap-3">
            <Shield className="w-5 h-5" />
            <span>Change PIN</span>
          </button>
          
          <div className="space-y-2">
            <button
              onClick={() => setShowSeedPhrase(true)}
              className="w-full btn-secondary flex items-center justify-start gap-3"
            >
              <Eye className="w-5 h-5" />
              <span>View Seed Phrase</span>
            </button>
            
            {showSeedPhrase && (
              <div className="p-3 bg-crypto-dark rounded-lg">
                <p className="text-sm text-gray-400 mb-2">Enter your PIN to view seed phrase:</p>
                <div className="flex gap-2">
                  <input
                    type="password"
                    value={pin}
                    onChange={(e) => setPin(e.target.value)}
                    placeholder="PIN"
                    className="input-field flex-1"
                    maxLength={4}
                  />
                  <button
                    onClick={handleViewSeedPhrase}
                    className="btn-primary px-4"
                  >
                    View
                  </button>
                </div>
              </div>
            )}
          </div>
          
          <div className="space-y-2">
            <button
              onClick={() => setShowPrivateKey(true)}
              className="w-full btn-secondary flex items-center justify-start gap-3"
            >
              <Key className="w-5 h-5" />
              <span>View Private Key</span>
            </button>
            
            {showPrivateKey && (
              <div className="p-3 bg-crypto-dark rounded-lg">
                <p className="text-sm text-gray-400 mb-2">Enter your PIN to view private key:</p>
                <div className="flex gap-2">
                  <input
                    type="password"
                    value={pin}
                    onChange={(e) => setPin(e.target.value)}
                    placeholder="PIN"
                    className="input-field flex-1"
                    maxLength={4}
                  />
                  <button
                    onClick={handleViewPrivateKey}
                    className="btn-primary px-4"
                  >
                    View
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Support */}
      <div className="card mb-6">
        <h3 className="text-lg font-medium mb-4">Support</h3>
        <button
          onClick={chatAdmin}
          className="w-full btn-secondary flex items-center justify-start gap-3"
        >
          <MessageCircle className="w-5 h-5" />
          <span>Chat with Admin</span>
        </button>
      </div>

      {/* Logout */}
      <div className="card">
        <button className="w-full btn-secondary flex items-center justify-start gap-3 text-red-400 hover:text-red-300">
          <LogOut className="w-5 h-5" />
          <span>Logout</span>
        </button>
      </div>

      {/* Seed Phrase Modal */}
      {showSeedPhrase && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-6 z-50">
          <div className="card max-w-md w-full">
            <h3 className="text-lg font-medium mb-4">Seed Phrase</h3>
            <div className="bg-crypto-dark p-4 rounded-lg mb-4">
              <p className="text-sm text-gray-400 mb-2">Write down these 12 words in order:</p>
              <div className="grid grid-cols-2 gap-2 text-sm">
                {['abandon', 'ability', 'able', 'about', 'above', 'absent', 'absorb', 'abstract', 'absurd', 'abuse', 'access', 'accident'].map((word, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <span className="text-gray-500 text-xs">{index + 1}.</span>
                    <span className="font-mono">{word}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setShowSeedPhrase(false)}
                className="flex-1 btn-secondary"
              >
                Close
              </button>
              <button
                onClick={() => {
                  navigator.clipboard.writeText('abandon ability able about above absent absorb abstract absurd abuse access accident')
                  toast.success('Seed phrase copied!')
                }}
                className="flex-1 btn-primary"
              >
                Copy
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Private Key Modal */}
      {showPrivateKey && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-6 z-50">
          <div className="card max-w-md w-full">
            <h3 className="text-lg font-medium mb-4">Private Key</h3>
            <div className="bg-crypto-dark p-4 rounded-lg mb-4">
              <p className="text-sm text-gray-400 mb-2">Your private key (keep it secret!):</p>
              <code className="text-sm break-all">
                0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef
              </code>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setShowPrivateKey(false)}
                className="flex-1 btn-secondary"
              >
                Close
              </button>
              <button
                onClick={() => {
                  navigator.clipboard.writeText('0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef')
                  toast.success('Private key copied!')
                }}
                className="flex-1 btn-primary"
              >
                Copy
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 