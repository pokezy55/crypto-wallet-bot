'use client'

import { useState, useEffect } from 'react'
import { Wallet, Clipboard, Users, Settings, Plus, Download } from 'lucide-react'
import toast from 'react-hot-toast'

// Components
import TelegramLogin from '@/components/TelegramLogin'
import WalletTab from '@/components/WalletTab'
import TaskTab from '@/components/TaskTab'
import ReferralTab from '@/components/ReferralTab'
import MenuTab from '@/components/MenuTab'
import CreateWalletModal from '@/components/CreateWalletModal'
import ImportWalletModal from '@/components/ImportWalletModal'

// Prevent prerendering
export const dynamic = 'force-dynamic';

// Types
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
  }
}

export default function Home() {
  const [user, setUser] = useState<User | null>(null)
  const [wallet, setWallet] = useState<Wallet | null>(null)
  const [activeTab, setActiveTab] = useState<'wallet' | 'task' | 'referral' | 'menu'>('wallet')
  const [showCreateWallet, setShowCreateWallet] = useState(false)
  const [showImportWallet, setShowImportWallet] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Initialize Telegram WebApp
    if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
      window.Telegram.WebApp.ready()
      window.Telegram.WebApp.expand()
      
      // Get user data from Telegram
      const telegramUser = window.Telegram.WebApp.initDataUnsafe.user
      if (telegramUser) {
        setUser(telegramUser)
        // Check if user has wallet
        checkUserWallet(telegramUser.id)
      }
    }
    setIsLoading(false)
  }, [])

  const checkUserWallet = async (userId: number) => {
    try {
      // This would be an API call to check if user has wallet
      // For now, we'll simulate it
      const hasWallet = localStorage.getItem(`wallet_${userId}`)
      if (hasWallet) {
        setWallet(JSON.parse(hasWallet))
      }
    } catch (error) {
      console.error('Error checking wallet:', error)
    }
  }

  const handleCreateWallet = async () => {
    setShowCreateWallet(true)
  }

  const handleImportWallet = () => {
    setShowImportWallet(true)
  }

  const handleWalletCreated = (newWallet: Wallet) => {
    setWallet(newWallet)
    setShowCreateWallet(false)
    toast.success('Wallet created successfully!')
  }

  const handleWalletImported = (importedWallet: Wallet) => {
    setWallet(importedWallet)
    setShowImportWallet(false)
    toast.success('Wallet imported successfully!')
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
      </div>
    )
  }

  if (!user) {
    return <TelegramLogin onLogin={setUser} />
  }

  if (!wallet) {
    return (
      <div className="min-h-screen bg-crypto-dark flex flex-col items-center justify-center p-6">
        {/* Logo */}
        <div className="mb-8">
          <div className="w-24 h-24 bg-gradient-to-br from-primary-500 to-primary-700 rounded-full flex items-center justify-center mb-4">
            <Wallet className="w-12 h-12 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white text-center">Crypto Wallet Bot</h1>
        </div>

        {/* Description */}
        <div className="text-center mb-8 max-w-md">
          <p className="text-gray-300 mb-4">
            Welcome to your secure crypto wallet! Create a new wallet or import an existing one to start managing your digital assets.
          </p>
          <p className="text-sm text-gray-400">
            Support for all EVM-compatible networks including Ethereum, BSC, Polygon, and more.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="w-full max-w-sm space-y-4">
          <button
            onClick={handleCreateWallet}
            className="w-full btn-primary flex items-center justify-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Create New Wallet
          </button>
          
          <button
            onClick={handleImportWallet}
            className="w-full btn-secondary flex items-center justify-center gap-2"
          >
            <Download className="w-5 h-5" />
            Import Wallet
          </button>
        </div>

        {/* Modals */}
        <CreateWalletModal
          isOpen={showCreateWallet}
          onClose={() => setShowCreateWallet(false)}
          onWalletCreated={handleWalletCreated}
          userId={user.id}
        />
        
        <ImportWalletModal
          isOpen={showImportWallet}
          onClose={() => setShowImportWallet(false)}
          onWalletImported={handleWalletImported}
          userId={user.id}
        />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-crypto-dark flex flex-col">
      {/* Main Content */}
      <div className="flex-1 overflow-y-auto pb-20">
        {activeTab === 'wallet' && <WalletTab wallet={wallet} user={user} />}
        {activeTab === 'task' && <TaskTab user={user} />}
        {activeTab === 'referral' && <ReferralTab user={user} />}
        {activeTab === 'menu' && <MenuTab wallet={wallet} user={user} />}
      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-crypto-card border-t border-crypto-border">
        <div className="flex justify-around py-2">
          <button
            onClick={() => setActiveTab('wallet')}
            className={`flex flex-col items-center py-2 px-4 rounded-lg transition-colors ${
              activeTab === 'wallet' ? 'text-primary-500' : 'text-gray-400'
            }`}
          >
            <Wallet className="w-6 h-6 mb-1" />
            <span className="text-xs">Wallet</span>
          </button>
          
          <button
            onClick={() => setActiveTab('task')}
            className={`flex flex-col items-center py-2 px-4 rounded-lg transition-colors ${
              activeTab === 'task' ? 'text-primary-500' : 'text-gray-400'
            }`}
          >
            <Clipboard className="w-6 h-6 mb-1" />
            <span className="text-xs">Task</span>
          </button>
          
          <button
            onClick={() => setActiveTab('referral')}
            className={`flex flex-col items-center py-2 px-4 rounded-lg transition-colors ${
              activeTab === 'referral' ? 'text-primary-500' : 'text-gray-400'
            }`}
          >
            <Users className="w-6 h-6 mb-1" />
            <span className="text-xs">Referral</span>
          </button>
          
          <button
            onClick={() => setActiveTab('menu')}
            className={`flex flex-col items-center py-2 px-4 rounded-lg transition-colors ${
              activeTab === 'menu' ? 'text-primary-500' : 'text-gray-400'
            }`}
          >
            <Settings className="w-6 h-6 mb-1" />
            <span className="text-xs">Menu</span>
          </button>
        </div>
      </div>
    </div>
  )
} 