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
  referred_by?: number
  custom_code?: string
}

interface Wallet {
  id: string;
  address: string;
  seedPhrase?: string;
  privateKey?: string;
  balance: Record<string, Record<string, string>>;
}

export default function Home() {
  const [user, setUser] = useState<User | null>(null)
  const [wallet, setWallet] = useState<Wallet | null>(null)
  const [activeTab, setActiveTab] = useState<'wallet' | 'task' | 'referral' | 'menu'>('wallet')
  const [showCreateWallet, setShowCreateWallet] = useState(false)
  const [showImportWallet, setShowImportWallet] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  // Parse Telegram WebApp data
  useEffect(() => {
    const initTelegramWebApp = () => {
      try {
        if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
    // Initialize Telegram WebApp
          const webApp = window.Telegram.WebApp;
          webApp.ready();
          webApp.expand();
          
          // Get user data
          if (webApp.initDataUnsafe?.user) {
            const telegramUser = webApp.initDataUnsafe.user;
            setUser({
              id: telegramUser.id,
              first_name: telegramUser.first_name,
              last_name: telegramUser.last_name,
              username: telegramUser.username,
              photo_url: telegramUser.photo_url
            });
            
            // Check user wallet
            checkUserWallet(telegramUser.id);
            
            // Check for referral code in start param
            const startParam = webApp.initDataUnsafe?.start_param;
            if (startParam) {
              // Track referral using custom code
              trackReferral(startParam, telegramUser.id);
            }
      }
    }
        setIsLoading(false);
      } catch (error) {
        console.error('Error initializing Telegram WebApp:', error);
        setIsLoading(false);
      }
    };
    
    initTelegramWebApp();
  }, []);

  // Track referral
  const trackReferral = async (referralCode: string, newUserId: number) => {
    try {
      const response = await fetch('/api/referral/track', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          referralCode,
          newUserId
        }),
      });
      
      const data = await response.json();
      if (!response.ok) {
        console.error('Error tracking referral:', data.error);
      }
    } catch (error) {
      console.error('Failed to track referral:', error);
    }
  };

  // Selalu fetch wallet dari backend setiap kali tab wallet aktif
  useEffect(() => {
    if (user && activeTab === 'wallet') {
      checkUserWallet(user.id)
    }
  }, [user, activeTab])
  
  // Fetch user data ketika tab referral aktif
  useEffect(() => {
    if (user && activeTab === 'referral') {
      const fetchUserData = async () => {
        try {
          const res = await fetch(`/api/user/${user.id}`)
          if (res.ok) {
            const userData = await res.json()
            // Update user dengan data terbaru
            setUser(prevUser => ({
              ...prevUser!,
              custom_code: userData.custom_code,
              referred_by: userData.referred_by
            }))
          }
        } catch (error) {
          console.error('Error fetching user data:', error)
        }
      }
      
      fetchUserData()
    }
  }, [user, activeTab])

  const checkUserWallet = async (userId: number) => {
    try {
      // Hapus cache localStorage, selalu fetch dari backend
      // const cachedWallet = localStorage.getItem(`wallet_${userId}`)
      // if (cachedWallet) {
      //   setWallet(JSON.parse(cachedWallet))
      //   return
      // }
      // Fetch wallet from database
      const response = await fetch(`/api/wallet/${userId}`)
      if (response.ok) {
        const walletData = await response.json()
        // localStorage.setItem(`wallet_${userId}`, JSON.stringify(walletData))
        setWallet(walletData)
      } else if (response.status === 404) {
        setWallet(null)
      } else {
        console.error('Error fetching wallet from database')
        setWallet(null)
      }
    } catch (error) {
      console.error('Error checking wallet:', error)
      setWallet(null)
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

  // Update user referral status
  const updateUserReferralStatus = (referredBy: number) => {
    if (user) {
      setUser({
        ...user,
        referred_by: referredBy
      });
    }
  }

  // Update user custom code
  const updateUserCustomCode = (customCode: string) => {
    if (user) {
      setUser({
        ...user,
        custom_code: customCode
      });
    }
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
      <div className="min-h-screen bg-crypto-dark flex flex-col items-center p-6">
        {/* Logo */}
        <div className="flex-1 flex flex-col items-center justify-center max-w-md w-full">
        <div className="mb-8">
            <div className="w-24 h-24 bg-primary-500 rounded-full flex items-center justify-center mb-6 mx-auto">
            <Wallet className="w-12 h-12 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white text-center">Crypto Wallet Bot</h1>
        </div>

        {/* Description */}
          <div className="text-center mb-12 w-full">
          <p className="text-gray-300 mb-4">
            Welcome to your secure crypto wallet! Create a new wallet or import an existing one to start managing your digital assets.
          </p>
          <p className="text-sm text-gray-400">
            Support for all EVM-compatible networks including Ethereum, BSC, Polygon, and more.
          </p>
        </div>

        {/* Action Buttons */}
          <div className="w-full space-y-4">
          <button
            onClick={handleCreateWallet}
              className="w-full btn-primary flex items-center justify-center gap-2 py-3"
          >
            <Plus className="w-5 h-5" />
            Create New Wallet
          </button>
          
          <button
            onClick={handleImportWallet}
              className="w-full btn-secondary flex items-center justify-center gap-2 py-3"
          >
            <Download className="w-5 h-5" />
            Import Wallet
          </button>
          </div>
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
        {activeTab === 'referral' && <ReferralTab user={user} wallet={wallet} onUpdateReferralStatus={updateUserReferralStatus} onUpdateCustomCode={updateUserCustomCode} />}
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