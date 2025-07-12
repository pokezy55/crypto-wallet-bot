'use client'

import { useState } from 'react'
import { X, Download, Copy, Eye, EyeOff } from 'lucide-react'
import toast from 'react-hot-toast'

interface Wallet {
  address: string
  balance: {
    eth: string
    usdt: string
  }
}

interface CreateWalletModalProps {
  isOpen: boolean
  onClose: () => void
  onWalletCreated: (wallet: Wallet) => void
  userId: number
}

export default function CreateWalletModal({ isOpen, onClose, onWalletCreated, userId }: CreateWalletModalProps) {
  const [step, setStep] = useState<'create' | 'backup'>('create')
  const [showSeedPhrase, setShowSeedPhrase] = useState(false)
  const [confirmedBackup, setConfirmedBackup] = useState(false)

  const seedPhrase = 'abandon ability able about above absent absorb abstract absurd abuse access accident'
  const walletAddress = '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6'

  const handleCreateWallet = () => {
    // In a real app, this would generate a new wallet using ethers.js
    setStep('backup')
  }

  const copySeedPhrase = () => {
    navigator.clipboard.writeText(seedPhrase)
    toast.success('Seed phrase copied!')
  }

  const downloadSeedPhrase = () => {
    const blob = new Blob([seedPhrase], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'seed-phrase.txt'
    a.click()
    URL.revokeObjectURL(url)
    toast.success('Seed phrase downloaded!')
  }

  const handleConfirmBackup = () => {
    if (!confirmedBackup) {
      toast.error('Please confirm that you have backed up your seed phrase')
      return
    }

    // Save wallet to localStorage (in real app, this would be saved to database)
    const newWallet: Wallet = {
      address: walletAddress,
      balance: {
        eth: '0.0',
        usdt: '0.00'
      }
    }
    
    localStorage.setItem(`wallet_${userId}`, JSON.stringify(newWallet))
    onWalletCreated(newWallet)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-6 z-50">
      <div className="card max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold">
            {step === 'create' ? 'Create New Wallet' : 'Backup Seed Phrase'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-crypto-border"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {step === 'create' ? (
          <div className="space-y-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-primary-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <Download className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-lg font-medium mb-2">Create Your Wallet</h3>
              <p className="text-gray-400 text-sm">
                Generate a new EVM-compatible wallet to start managing your crypto assets
              </p>
            </div>

            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-primary-600 rounded-full flex items-center justify-center text-xs font-bold mt-0.5">
                  1
                </div>
                <div>
                  <p className="font-medium">Generate wallet</p>
                  <p className="text-gray-400 text-sm">Create a new wallet with unique address</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-primary-600 rounded-full flex items-center justify-center text-xs font-bold mt-0.5">
                  2
                </div>
                <div>
                  <p className="font-medium">Backup seed phrase</p>
                  <p className="text-gray-400 text-sm">Write down 12 words to recover wallet</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-primary-600 rounded-full flex items-center justify-center text-xs font-bold mt-0.5">
                  3
                </div>
                <div>
                  <p className="font-medium">Start using</p>
                  <p className="text-gray-400 text-sm">Receive, send, and swap crypto</p>
                </div>
              </div>
            </div>

            <button
              onClick={handleCreateWallet}
              className="w-full btn-primary"
            >
              Create Wallet
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-yellow-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <Eye className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-lg font-medium mb-2">Backup Your Seed Phrase</h3>
              <p className="text-gray-400 text-sm">
                Write down these 12 words in order. You'll need them to recover your wallet.
              </p>
            </div>

            <div className="bg-crypto-dark p-4 rounded-lg">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium">Seed Phrase</span>
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowSeedPhrase(!showSeedPhrase)}
                    className="p-1 hover:bg-crypto-border rounded"
                  >
                    {showSeedPhrase ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                  <button
                    onClick={copySeedPhrase}
                    className="p-1 hover:bg-crypto-border rounded"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                  <button
                    onClick={downloadSeedPhrase}
                    className="p-1 hover:bg-crypto-border rounded"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                </div>
              </div>
              
              {showSeedPhrase ? (
                <div className="grid grid-cols-2 gap-2 text-sm">
                  {seedPhrase.split(' ').map((word, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <span className="text-gray-500 text-xs">{index + 1}.</span>
                      <span className="font-mono">{word}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2 text-sm">
                  {Array.from({ length: 12 }, (_, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <span className="text-gray-500 text-xs">{index + 1}.</span>
                      <span className="font-mono">••••••</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-5 h-5 border-2 border-red-500 rounded flex items-center justify-center mt-0.5">
                  <span className="text-red-500 text-xs">!</span>
                </div>
                <div>
                  <p className="font-medium text-red-400">Important Security Notes</p>
                  <ul className="text-sm text-gray-400 mt-1 space-y-1">
                    <li>• Never share your seed phrase with anyone</li>
                    <li>• Store it in a secure, offline location</li>
                    <li>• You cannot recover your wallet without it</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="confirm-backup"
                checked={confirmedBackup}
                onChange={(e) => setConfirmedBackup(e.target.checked)}
                className="w-4 h-4 text-primary-600 bg-crypto-dark border-crypto-border rounded focus:ring-primary-500"
              />
              <label htmlFor="confirm-backup" className="text-sm">
                I have written down my seed phrase and stored it securely
              </label>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setStep('create')}
                className="flex-1 btn-secondary"
              >
                Back
              </button>
              <button
                onClick={handleConfirmBackup}
                disabled={!confirmedBackup}
                className="flex-1 btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Complete Setup
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
} 