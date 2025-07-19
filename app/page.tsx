'use client'

import { useState, useEffect } from 'react'
import { Loader2, Wallet, ListChecks, Users, Menu } from 'lucide-react'
import WalletTab from '@/components/WalletTab'
import TaskTab from '@/components/TaskTab'
import ReferralTab from '@/components/ReferralTab'
import MenuTab from '@/components/MenuTab'
import CreateWalletModal from '@/components/CreateWalletModal'
import ImportWalletModal from '@/components/ImportWalletModal'
import TelegramAuth from '@/components/TelegramAuth'

export default function Home() {
  const [user, setUser] = useState<any>(null)
  const [wallet, setWallet] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'wallet' | 'task' | 'referral' | 'menu'>('wallet')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showImportModal, setShowImportModal] = useState(false)

  // Handle user authentication from TelegramAuth
  const handleAuth = (telegramUser: any) => {
    setUser(telegramUser);
    checkUserWallet(telegramUser.id);
  };

  // Check if user has wallet
  const checkUserWallet = async (userId: number) => {
    try {
      const res = await fetch(`/api/wallet/${userId}`)
      if (res.ok) {
        const data = await res.json()
        setWallet(data)
      } else {
        console.log('User has no wallet yet')
      }
      setIsLoading(false)
    } catch (error) {
      console.error('Error checking wallet:', error)
      setIsLoading(false)
    }
  }

  // Handle wallet creation
  const handleWalletCreated = (newWallet: any) => {
    setWallet(newWallet)
    
    // Check if there's a stored referral code and track it
    const referralCode = localStorage.getItem('referralCode')
    if (referralCode && user?.id) {
      trackReferral(referralCode, user.id, newWallet.address)
    }
  }

  // Track referral
  const trackReferral = async (referralCode: string, userId: number, walletAddress: string) => {
    try {
      const response = await fetch('/api/referral/track', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          referralCode,
          userId,
          walletAddress
        }),
      });
      
      const data = await response.json();
      if (response.ok) {
        // Clear referral code from localStorage after successful tracking
        localStorage.removeItem('referralCode');
        console.log('Referral tracked successfully');
      } else {
        console.error('Error tracking referral:', data.error);
      }
    } catch (error) {
      console.error('Failed to track referral:', error);
    }
  };

  // Always fetch wallet from backend when wallet tab is active
  useEffect(() => {
    if (activeTab === 'wallet' && user?.id && !isLoading) {
      checkUserWallet(user.id)
    }
  }, [activeTab, user?.id, isLoading])

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-6">
        <Loader2 className="w-12 h-12 text-primary-500 animate-spin mb-4" />
        <p className="text-white text-lg">Loading...</p>
      </div>
    )
  }

  return (
    <main className="min-h-screen flex flex-col">
      {/* Telegram Auth component */}
      <TelegramAuth onAuth={handleAuth} />
      
      {/* Main Content */}
      <div className="flex-1 pb-16">
        {!wallet ? (
          <div className="flex flex-col items-center justify-center min-h-screen p-6 text-center">
            <h1 className="text-2xl font-bold mb-6">Welcome to Crypto Wallet Bot</h1>
            <p className="text-gray-400 mb-8">Create a new wallet or import an existing one to get started</p>
            
            <div className="space-y-4 w-full max-w-md">
              <button 
                className="btn-primary w-full py-4 text-lg"
                onClick={() => setShowCreateModal(true)}
              >
                Create New Wallet
              </button>
              
              <button 
                className="btn-secondary w-full py-4 text-lg"
                onClick={() => setShowImportModal(true)}
              >
                Import Existing Wallet
              </button>
            </div>
          </div>
        ) : (
          <>
            {activeTab === 'wallet' && <WalletTab wallet={wallet} user={user} />}
            {activeTab === 'task' && <TaskTab user={user} />}
            {activeTab === 'referral' && <ReferralTab user={user} />}
            {activeTab === 'menu' && <MenuTab user={user} wallet={wallet} />}
          </>
        )}
      </div>
      
      {/* Bottom Navigation */}
      {wallet && (
        <div className="fixed bottom-0 left-0 right-0 bg-crypto-card border-t border-crypto-border flex justify-around py-2">
          <button 
            className={`flex flex-col items-center p-2 ${activeTab === 'wallet' ? 'text-primary-500' : 'text-gray-400'}`}
            onClick={() => setActiveTab('wallet')}
          >
            <Wallet className="w-6 h-6" />
            <span className="text-xs">Wallet</span>
          </button>
          
          <button 
            className={`flex flex-col items-center p-2 ${activeTab === 'task' ? 'text-primary-500' : 'text-gray-400'}`}
            onClick={() => setActiveTab('task')}
          >
            <ListChecks className="w-6 h-6" />
            <span className="text-xs">Tasks</span>
          </button>
          
          <button 
            className={`flex flex-col items-center p-2 ${activeTab === 'referral' ? 'text-primary-500' : 'text-gray-400'}`}
            onClick={() => setActiveTab('referral')}
          >
            <Users className="w-6 h-6" />
            <span className="text-xs">Referral</span>
          </button>
          
          <button 
            className={`flex flex-col items-center p-2 ${activeTab === 'menu' ? 'text-primary-500' : 'text-gray-400'}`}
            onClick={() => setActiveTab('menu')}
          >
            <Menu className="w-6 h-6" />
            <span className="text-xs">Menu</span>
          </button>
        </div>
      )}
      
      {/* Modals */}
      <CreateWalletModal 
        isOpen={showCreateModal} 
        onClose={() => setShowCreateModal(false)}
        onWalletCreated={handleWalletCreated}
        userId={user?.id}
      />
      
      <ImportWalletModal 
        isOpen={showImportModal} 
        onClose={() => setShowImportModal(false)}
        onWalletImported={handleWalletCreated}
        userId={user?.id}
      />
    </main>
  )
} 