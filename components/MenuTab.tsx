'use client'

import { useState, useEffect } from 'react'
import { User, Shield, Eye, Key, MessageCircle, Copy, LogOut, Settings, Moon, Sun, Bell, BellOff, Globe, Zap } from 'lucide-react'
import toast from 'react-hot-toast'
import { formatAddress, isValidAddress } from '@/lib/address'
import PinModal from './PinModal'
import ChangePinModal from './ChangePinModal'
import { useSettings } from '@/lib/SettingsContext'

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
}

interface MenuTabProps {
  wallet: Wallet
  user: User
}

export default function MenuTab({ wallet, user }: MenuTabProps) {
  // State untuk modals
  const [showSeedPhraseModal, setShowSeedPhraseModal] = useState(false)
  const [showPrivateKeyModal, setShowPrivateKeyModal] = useState(false)
  const [showChangePinModal, setShowChangePinModal] = useState(false)
  
  // State untuk data
  const [seedPhrase, setSeedPhrase] = useState('')
  const [privateKey, setPrivateKey] = useState('')
  
  // Settings context
  const { 
    settings, 
    updateSettings, 
    isPinSet, 
    setPin, 
    verifyPin, 
    changePin, 
    getSeedPhrase, 
    getPrivateKey,
    updatePreferences
  } = useSettings()

  // Copy wallet address
  const copyAddress = () => {
    if (isValidAddress(wallet.address)) {
      navigator.clipboard.writeText(wallet.address)
      toast.success('Alamat wallet disalin!')
    } else {
      toast.error('Alamat wallet tidak valid!')
    }
  }

  // Handle PIN verification for seed phrase
  const handleViewSeedPhrase = async (pin: string) => {
    const result = await getSeedPhrase(user.id, pin)
    
    if (result.success && result.seedPhrase) {
      setSeedPhrase(result.seedPhrase)
      setShowSeedPhraseModal(false)
      setTimeout(() => {
        toast.success('Seed phrase berhasil ditampilkan')
      }, 500)
      return { success: true }
    } else {
      return { success: false, error: result.error || 'PIN tidak valid' }
    }
  }

  // Handle PIN verification for private key
  const handleViewPrivateKey = async (pin: string) => {
    const result = await getPrivateKey(user.id, pin)
    
    if (result.success && result.privateKey) {
      setPrivateKey(result.privateKey)
      setShowPrivateKeyModal(false)
      setTimeout(() => {
        toast.success('Private key berhasil ditampilkan')
      }, 500)
      return { success: true }
    } else {
      return { success: false, error: result.error || 'PIN tidak valid' }
    }
  }

  // Handle PIN change
  const handleChangePin = async (currentPin: string, newPin: string) => {
    if (isPinSet) {
      const result = await changePin(user.id, currentPin, newPin)
      if (result.success) {
        toast.success('PIN berhasil diubah')
      }
      return result
    } else {
      const result = await setPin(user.id, newPin)
      if (result.success) {
        toast.success('PIN berhasil dibuat')
      }
      return result
    }
  }

  // Toggle settings
  const toggleSetting = (key: string, value: boolean) => {
    updateSettings({ [key]: value })
    updatePreferences(user.id, { [key]: value })
    toast.success(`Pengaturan ${key} diperbarui`)
  }

  // Change language
  const changeLanguage = (language: string) => {
    updateSettings({ language })
    updatePreferences(user.id, { language })
    toast.success(`Bahasa diubah ke ${language === 'id' ? 'Indonesia' : 'English'}`)
  }

  // Chat with admin
  const chatAdmin = () => {
    if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
      window.Telegram.WebApp.openTelegramLink('https://t.me/CoinTwoSupport')
    } else {
      window.open('https://t.me/CoinTwoSupport', '_blank')
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
            <span className="text-gray-400">Alamat Wallet</span>
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
            <span className="font-medium">{wallet.balance.eth?.usdt}</span>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-gray-400">USDT Balance</span>
            <span className="font-medium">${wallet.balance.usdt?.usdt}</span>
          </div>
        </div>
      </div>

      {/* Security Section */}
      <div className="card mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Shield className="w-5 h-5 text-primary-500" />
          <h3 className="text-lg font-medium">Keamanan</h3>
        </div>
        
        <div className="space-y-4">
          {/* PIN Code Settings */}
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span>PIN Code</span>
              <button
                onClick={() => setShowChangePinModal(true)}
                className="text-sm text-primary-500 hover:text-primary-400"
              >
                {isPinSet ? 'Ubah PIN' : 'Buat PIN'}
              </button>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-400">Lock on Load</span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={settings.lockOnLoad}
                  onChange={() => toggleSetting('lockOnLoad', !settings.lockOnLoad)}
                  disabled={!isPinSet}
                />
                <div className={`w-11 h-6 rounded-full peer ${isPinSet ? 'bg-gray-700 peer-checked:bg-primary-600' : 'bg-gray-700 opacity-50'} peer-focus:ring-2 peer-focus:ring-primary-800 transition-colors`}></div>
                <div className={`absolute left-[2px] top-[2px] bg-white rounded-full w-5 h-5 transition-transform ${settings.lockOnLoad && isPinSet ? 'translate-x-5' : ''}`}></div>
              </label>
            </div>
            
            {!isPinSet && (
              <p className="text-xs text-yellow-500">
                Buat PIN terlebih dahulu untuk mengaktifkan fitur keamanan
              </p>
            )}
          </div>
          
          <hr className="border-gray-700" />
          
          {/* Seed Phrase & Private Key */}
          <div className="space-y-3">
            <button
              onClick={() => setShowSeedPhraseModal(true)}
              className="w-full btn-secondary flex items-center justify-start gap-3"
              disabled={!isPinSet}
            >
              <Eye className="w-5 h-5" />
              <span>Lihat Seed Phrase</span>
            </button>
            
            <button
              onClick={() => setShowPrivateKeyModal(true)}
              className="w-full btn-secondary flex items-center justify-start gap-3"
              disabled={!isPinSet}
            >
              <Key className="w-5 h-5" />
              <span>Lihat Private Key</span>
            </button>
            
            {!isPinSet && (
              <p className="text-xs text-yellow-500">
                Buat PIN terlebih dahulu untuk melihat seed phrase dan private key
              </p>
            )}
          </div>
          
          <hr className="border-gray-700" />
          
          {/* Forget PIN */}
          <div>
            <p className="text-sm text-gray-400 mb-2">Lupa PIN?</p>
            <p className="text-xs text-gray-500 mb-3">
              Silakan hubungi admin untuk mengatur ulang PIN Anda
            </p>
            <button
              onClick={chatAdmin}
              className="btn-secondary text-sm w-full"
            >
              Chat Admin
            </button>
          </div>
        </div>
      </div>

      {/* Preferences Section */}
      <div className="card mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Settings className="w-5 h-5 text-primary-500" />
          <h3 className="text-lg font-medium">Preferensi</h3>
        </div>
        
        <div className="space-y-4">
          {/* Notifications */}
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              {settings.notificationsEnabled ? (
                <Bell className="w-5 h-5 text-primary-500" />
              ) : (
                <BellOff className="w-5 h-5 text-gray-500" />
              )}
              <span>Notifikasi</span>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                className="sr-only peer"
                checked={settings.notificationsEnabled}
                onChange={() => toggleSetting('notificationsEnabled', !settings.notificationsEnabled)}
              />
              <div className="w-11 h-6 bg-gray-700 rounded-full peer peer-checked:bg-primary-600 peer-focus:ring-2 peer-focus:ring-primary-800 transition-colors"></div>
              <div className={`absolute left-[2px] top-[2px] bg-white rounded-full w-5 h-5 transition-transform ${settings.notificationsEnabled ? 'translate-x-5' : ''}`}></div>
            </label>
          </div>
          
          {/* Theme */}
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              {settings.theme === 'dark' ? (
                <Moon className="w-5 h-5 text-primary-500" />
              ) : (
                <Sun className="w-5 h-5 text-yellow-500" />
              )}
              <span>Dark Mode</span>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                className="sr-only peer"
                checked={settings.theme === 'dark'}
                onChange={() => {
                  const newTheme = settings.theme === 'dark' ? 'light' : 'dark';
                  updateSettings({ theme: newTheme });
                  updatePreferences(user.id, { theme: newTheme });
                }}
              />
              <div className="w-11 h-6 bg-gray-700 rounded-full peer peer-checked:bg-primary-600 peer-focus:ring-2 peer-focus:ring-primary-800 transition-colors"></div>
              <div className={`absolute left-[2px] top-[2px] bg-white rounded-full w-5 h-5 transition-transform ${settings.theme === 'dark' ? 'translate-x-5' : ''}`}></div>
            </label>
          </div>
          
          {/* Language */}
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Globe className="w-5 h-5 text-primary-500" />
              <span>Bahasa</span>
            </div>
            <select
              value={settings.language}
              onChange={(e) => changeLanguage(e.target.value)}
              className="bg-crypto-dark border border-gray-700 rounded px-2 py-1 text-sm"
            >
              <option value="en">English</option>
              <option value="id">Indonesia</option>
            </select>
          </div>
          
          {/* High Performance Mode */}
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-primary-500" />
              <span>Mode Performa Tinggi</span>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                className="sr-only peer"
                checked={settings.highPerformanceMode}
                onChange={() => toggleSetting('highPerformanceMode', !settings.highPerformanceMode)}
              />
              <div className="w-11 h-6 bg-gray-700 rounded-full peer peer-checked:bg-primary-600 peer-focus:ring-2 peer-focus:ring-primary-800 transition-colors"></div>
              <div className={`absolute left-[2px] top-[2px] bg-white rounded-full w-5 h-5 transition-transform ${settings.highPerformanceMode ? 'translate-x-5' : ''}`}></div>
            </label>
          </div>
          
          <p className="text-xs text-gray-500">
            Mode performa tinggi akan mengurangi animasi dan membatasi polling untuk meningkatkan kinerja aplikasi
          </p>
        </div>
      </div>

      {/* Support Section */}
      <div className="card mb-6">
        <div className="flex items-center gap-2 mb-4">
          <MessageCircle className="w-5 h-5 text-primary-500" />
          <h3 className="text-lg font-medium">Dukungan</h3>
        </div>
        
        <button
          onClick={chatAdmin}
          className="w-full btn-secondary flex items-center justify-start gap-3"
        >
          <MessageCircle className="w-5 h-5" />
          <span>Chat dengan Admin</span>
        </button>
      </div>

      {/* Logout */}
      <div className="card">
        <button className="w-full btn-secondary flex items-center justify-start gap-3 text-red-400 hover:text-red-300">
          <LogOut className="w-5 h-5" />
          <span>Logout</span>
        </button>
      </div>

      {/* PIN Modal for Seed Phrase */}
      <PinModal
        isOpen={showSeedPhraseModal}
        onClose={() => setShowSeedPhraseModal(false)}
        onSubmit={handleViewSeedPhrase}
        title="Lihat Seed Phrase"
        description="Masukkan PIN untuk melihat seed phrase wallet Anda"
        confirmText="Konfirmasi"
      />

      {/* PIN Modal for Private Key */}
      <PinModal
        isOpen={showPrivateKeyModal}
        onClose={() => setShowPrivateKeyModal(false)}
        onSubmit={handleViewPrivateKey}
        title="Lihat Private Key"
        description="Masukkan PIN untuk melihat private key wallet Anda"
        confirmText="Konfirmasi"
      />

      {/* Change PIN Modal */}
      <ChangePinModal
        isOpen={showChangePinModal}
        onClose={() => setShowChangePinModal(false)}
        onSubmit={handleChangePin}
        isFirstTime={!isPinSet}
      />

      {/* Seed Phrase Modal */}
      {seedPhrase && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-6 z-50">
          <div className="card max-w-md w-full">
            <h3 className="text-lg font-medium mb-4">Seed Phrase</h3>
            <div className="bg-crypto-dark p-4 rounded-lg mb-4">
              <p className="text-sm text-gray-400 mb-2">Catat 12 kata ini sesuai urutan:</p>
              <div className="grid grid-cols-2 gap-2 text-sm">
                {seedPhrase.split(' ').map((word, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <span className="text-gray-500 text-xs">{index + 1}.</span>
                    <span className="font-mono">{word}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setSeedPhrase('')}
                className="flex-1 btn-secondary"
              >
                Tutup
              </button>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(seedPhrase)
                  toast.success('Seed phrase disalin!')
                }}
                className="flex-1 btn-primary"
              >
                Salin
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Private Key Modal */}
      {privateKey && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-6 z-50">
          <div className="card max-w-md w-full">
            <h3 className="text-lg font-medium mb-4">Private Key</h3>
            <div className="bg-crypto-dark p-4 rounded-lg mb-4">
              <p className="text-sm text-gray-400 mb-2">Private key Anda (jaga kerahasiaannya!):</p>
              <code className="text-sm break-all">
                {privateKey}
              </code>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setPrivateKey('')}
                className="flex-1 btn-secondary"
              >
                Tutup
              </button>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(privateKey)
                  toast.success('Private key disalin!')
                }}
                className="flex-1 btn-primary"
              >
                Salin
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 