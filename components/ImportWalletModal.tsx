'use client'

import { useState } from 'react'
import { X, Eye, EyeOff } from 'lucide-react'
import toast from 'react-hot-toast'

interface Wallet {
  address: string
  balance: {
    eth: string
    usdt: string
  }
}

interface ImportWalletModalProps {
  isOpen: boolean
  onClose: () => void
  onWalletImported: (wallet: Wallet) => void
  userId: number
}

export default function ImportWalletModal({ isOpen, onClose, onWalletImported, userId }: ImportWalletModalProps) {
  const [seedPhrase, setSeedPhrase] = useState('')
  const [showSeedPhrase, setShowSeedPhrase] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const handleImportWallet = async () => {
    if (!seedPhrase.trim()) {
      toast.error('Please enter your seed phrase')
      return
    }

    const words = seedPhrase.trim().split(/\s+/)
    if (words.length !== 12) {
      toast.error('Seed phrase must contain exactly 12 words')
      return
    }

    setIsLoading(true)

    try {
      // In a real app, this would use ethers.js to import the wallet
      // For demo purposes, we'll simulate the import
      await new Promise(resolve => setTimeout(resolve, 1000))

      const importedWallet: Wallet = {
        address: '0x' + Math.random().toString(16).substr(2, 40),
        balance: {
          eth: '0.0',
          usdt: '0.00'
        }
      }

      // Save wallet to localStorage (in real app, this would be saved to database)
      localStorage.setItem(`wallet_${userId}`, JSON.stringify(importedWallet))
      onWalletImported(importedWallet)
      toast.success('Wallet imported successfully!')
    } catch (error) {
      toast.error('Failed to import wallet. Please check your seed phrase.')
    } finally {
      setIsLoading(false)
    }
  }

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText()
      setSeedPhrase(text)
    } catch (error) {
      toast.error('Failed to paste from clipboard')
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-6 z-50">
      <div className="card max-w-md w-full">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold">Import Wallet</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-crypto-border"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-6">
          <div className="text-center">
            <div className="w-16 h-16 bg-primary-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <Eye className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-lg font-medium mb-2">Import Existing Wallet</h3>
            <p className="text-gray-400 text-sm">
              Enter your 12-word seed phrase to import your existing wallet
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Seed Phrase</label>
              <div className="relative">
                <textarea
                  value={seedPhrase}
                  onChange={(e) => setSeedPhrase(e.target.value)}
                  placeholder="Enter your 12-word seed phrase..."
                  className="input-field w-full h-24 resize-none"
                  style={{ paddingRight: '80px' }}
                />
                <div className="absolute right-2 top-2 flex gap-1">
                  <button
                    onClick={() => setShowSeedPhrase(!showSeedPhrase)}
                    className="p-1 hover:bg-crypto-border rounded"
                    type="button"
                  >
                    {showSeedPhrase ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                  <button
                    onClick={handlePaste}
                    className="p-1 hover:bg-crypto-border rounded text-xs"
                    type="button"
                  >
                    Paste
                  </button>
                </div>
              </div>
              <p className="text-xs text-gray-400 mt-1">
                {seedPhrase.split(/\s+/).filter(word => word.length > 0).length}/12 words
              </p>
            </div>

            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-5 h-5 border-2 border-yellow-500 rounded flex items-center justify-center mt-0.5">
                  <span className="text-yellow-500 text-xs">!</span>
                </div>
                <div>
                  <p className="font-medium text-yellow-400">Security Warning</p>
                  <ul className="text-sm text-gray-400 mt-1 space-y-1">
                    <li>• Only enter your seed phrase on trusted devices</li>
                    <li>• Make sure no one is watching your screen</li>
                    <li>• The app will never ask for your seed phrase again</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 btn-secondary"
                disabled={isLoading}
              >
                Cancel
              </button>
              <button
                onClick={handleImportWallet}
                disabled={isLoading || seedPhrase.split(/\s+/).filter(word => word.length > 0).length !== 12}
                className="flex-1 btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Importing...
                  </div>
                ) : (
                  'Import Wallet'
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 