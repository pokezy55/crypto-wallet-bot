'use client'

import React, { useState } from 'react';
import { X, Download, Copy, Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';

interface Wallet {
  id: string;
  address: string;
  balance?: Record<string, Record<string, string>>;
  seedPhrase?: string;
  createdAt?: string;
  updatedAt?: string;
}

interface CreateWalletModalProps {
  onClose: () => void;
  onSuccess: (wallet: Wallet) => void;
}

export default function CreateWalletModal({ onClose, onSuccess }: CreateWalletModalProps) {
  const [step, setStep] = useState<'create' | 'backup'>('create');
  const [showSeedPhrase, setShowSeedPhrase] = useState(false);
  const [seedPhrase, setSeedPhrase] = useState('');
  const [address, setAddress] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleCreateWallet = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/wallet/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      if (!response.ok) {
        throw new Error('Failed to create wallet');
      }

      const wallet = await response.json();
      setSeedPhrase(wallet.seedPhrase);
      setAddress(wallet.address);
      setStep('backup');
    } catch (error) {
      toast.error('Failed to create wallet');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopySeedPhrase = () => {
    navigator.clipboard.writeText(seedPhrase);
    toast.success('Seed phrase copied to clipboard!');
  };

  const handleConfirmBackup = async () => {
    try {
      onSuccess({
        id: Date.now().toString(),
        address,
        seedPhrase,
        balance: {}
      });
    } catch (error) {
      toast.error('Failed to save wallet');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-crypto-card border border-crypto-border rounded-xl p-6 w-full max-w-sm mx-4">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold">
            {step === 'create' ? 'Create New Wallet' : 'Backup Seed Phrase'}
          </h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-700 rounded">
            <X className="w-5 h-5" />
          </button>
        </div>

        {step === 'create' ? (
          <>
            <p className="text-gray-400 text-sm mb-6">
              Create a new wallet to start managing your crypto assets across multiple chains.
            </p>
            <button
              onClick={handleCreateWallet}
              disabled={isLoading}
              className="w-full btn-primary flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Creating...
                </>
              ) : (
                <>
                  <Download className="w-5 h-5" />
                  Create Wallet
                </>
              )}
            </button>
          </>
        ) : (
          <>
            <div className="mb-6">
              <p className="text-sm text-gray-400 mb-2">
                This is your wallet seed phrase. Write it down and keep it safe. You'll need it to recover your wallet.
              </p>
              <div className="relative">
                <div className="bg-crypto-dark p-4 rounded-lg font-mono text-sm break-all relative">
                  {showSeedPhrase ? seedPhrase : '• '.repeat(24)}
                  <button
                    onClick={() => setShowSeedPhrase(!showSeedPhrase)}
                    className="absolute right-2 top-1/2 -translate-y-1/2"
                  >
                    {showSeedPhrase ? (
                      <EyeOff className="w-4 h-4 text-gray-400" />
                    ) : (
                      <Eye className="w-4 h-4 text-gray-400" />
                    )}
                  </button>
                </div>
                <button
                  onClick={handleCopySeedPhrase}
                  className="absolute -right-2 -top-2 p-2 bg-primary-500 rounded-full shadow-lg"
                >
                  <Copy className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="flex gap-4">
              <button onClick={onClose} className="flex-1 btn-secondary">
                Cancel
              </button>
              <button onClick={handleConfirmBackup} className="flex-1 btn-primary">
                I've Backed It Up
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
} 