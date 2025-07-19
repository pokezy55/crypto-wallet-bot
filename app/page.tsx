'use client'

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Wallet as WalletIcon, Clipboard, Users, Settings, Plus, Download, Send, ArrowLeftRight } from 'lucide-react';
import toast from 'react-hot-toast';

// Components
import TelegramLogin from '@/components/TelegramLogin';
import WalletTab from '@/components/WalletTab';
import TaskTab from '@/components/TaskTab';
import ReferralTab from '@/components/ReferralTab';
import MenuTab from '@/components/MenuTab';
import CreateWalletModal from '@/components/CreateWalletModal';
import ImportWalletModal from '@/components/ImportWalletModal';
import { useTokenPrices } from '@/hooks/useTokenPrices';

// Prevent prerendering
export const dynamic = 'force-dynamic';

// Types
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
  balance?: Record<string, Record<string, string>>;
  seedPhrase?: string;
  createdAt?: string;
  updatedAt?: string;
}

export default function Home() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [activeTab, setActiveTab] = useState<'wallet' | 'task' | 'referral' | 'menu'>('wallet');
  const [selectedChain, setSelectedChain] = useState('eth');
  const [activeSection, setActiveSection] = useState('main');
  const [showAddToken, setShowAddToken] = useState(false);
  const [showCreateWallet, setShowCreateWallet] = useState(false);
  const [showImportWallet, setShowImportWallet] = useState(false);
  const tokenPrices = useTokenPrices();
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
        checkUserWallet(telegramUser.id)
      }
    }
    setIsLoading(false)
  }, [])

  // Selalu fetch wallet dari backend setiap kali tab wallet aktif
  useEffect(() => {
    if (user && activeTab === 'wallet') {
      checkUserWallet(user.id)
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

  const handleAuth = (user: User) => {
    setUser(user);
    checkUserWallet(user.id);
  };

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

  return (
    <main className="min-h-screen bg-crypto-dark text-white">
      {!user ? (
        <div className="flex items-center justify-center min-h-screen">
          <TelegramLogin onAuth={handleAuth} />
        </div>
      ) : !wallet ? (
        <div className="flex flex-col items-center justify-center min-h-screen p-4">
          <h1 className="text-2xl font-bold mb-8">Welcome to Crypto Wallet</h1>
          <div className="flex gap-4">
            <button
              onClick={() => setShowCreateWallet(true)}
              className="btn-primary flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Create New Wallet
            </button>
            <button
              onClick={() => setShowImportWallet(true)}
              className="btn-secondary flex items-center gap-2"
            >
              <Download className="w-5 h-5" />
              Import Wallet
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* Main Content */}
          <div className="flex-1 overflow-y-auto pb-20">
            {activeTab === 'wallet' && (
              <WalletTab 
                chain={selectedChain}
                wallet={wallet}
                tokenPrices={tokenPrices}
                onSend={() => setActiveSection('send')}
                onReceive={() => setActiveSection('receive')}
                onSwap={() => setActiveSection('swap')}
                onAdd={() => setShowAddToken(true)}
              />
            )}
            {activeTab === 'task' && <TaskTab user={user} />}
            {activeTab === 'referral' && <ReferralTab user={user} />}
            {activeTab === 'menu' && <MenuTab wallet={wallet} user={user} />}
          </div>

          {/* Bottom Navigation */}
          <nav className="fixed bottom-0 left-0 right-0 bg-crypto-card border-t border-crypto-border">
            <div className="flex justify-around p-2">
              <button
                onClick={() => setActiveTab('wallet')}
                className={`flex flex-col items-center p-2 rounded-lg ${
                  activeTab === 'wallet' ? 'text-primary-500' : 'text-gray-400'
                }`}
              >
                <WalletIcon className="w-6 h-6" />
                <span className="text-xs mt-1">Wallet</span>
              </button>
              <button
                onClick={() => setActiveTab('task')}
                className={`flex flex-col items-center p-2 rounded-lg ${
                  activeTab === 'task' ? 'text-primary-500' : 'text-gray-400'
                }`}
              >
                <Clipboard className="w-6 h-6" />
                <span className="text-xs mt-1">Task</span>
              </button>
              <button
                onClick={() => setActiveTab('referral')}
                className={`flex flex-col items-center p-2 rounded-lg ${
                  activeTab === 'referral' ? 'text-primary-500' : 'text-gray-400'
                }`}
              >
                <Users className="w-6 h-6" />
                <span className="text-xs mt-1">Referral</span>
              </button>
              <button
                onClick={() => setActiveTab('menu')}
                className={`flex flex-col items-center p-2 rounded-lg ${
                  activeTab === 'menu' ? 'text-primary-500' : 'text-gray-400'
                }`}
              >
                <Settings className="w-6 h-6" />
                <span className="text-xs mt-1">Menu</span>
              </button>
            </div>
          </nav>

          {/* Modals */}
          {showCreateWallet && (
            <CreateWalletModal
              onClose={() => setShowCreateWallet(false)}
              onSuccess={(newWallet) => {
                setWallet(newWallet);
                setShowCreateWallet(false);
                toast.success('Wallet created successfully!');
              }}
            />
          )}

          {showImportWallet && (
            <ImportWalletModal
              onClose={() => setShowImportWallet(false)}
              onSuccess={(importedWallet) => {
                setWallet(importedWallet);
                setShowImportWallet(false);
                toast.success('Wallet imported successfully!');
              }}
            />
          )}
        </>
      )}
    </main>
  );
} 