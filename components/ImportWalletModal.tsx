'use client'

import React, { useState } from 'react';
import { X, Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';

interface Wallet {
  id: string;
  address: string;
  balance?: Record<string, Record<string, string>>;
  seedPhrase?: string;
  createdAt?: string;
  updatedAt?: string;
}

interface ImportWalletModalProps {
  onClose: () => void;
  onSuccess: (wallet: Wallet) => void;
}

export default function ImportWalletModal({ onClose, onSuccess }: ImportWalletModalProps) {
  const [seedPhrase, setSeedPhrase] = useState('');
  const [showSeedPhrase, setShowSeedPhrase] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleImport = async () => {
    if (!seedPhrase.trim()) {
      toast.error('Please enter your seed phrase');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/wallet/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ seedPhrase })
      });

      if (!response.ok) {
        throw new Error('Failed to import wallet');
      }

      const wallet = await response.json();
      onSuccess(wallet);
    } catch (error) {
      toast.error('Failed to import wallet');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-crypto-card border border-crypto-border rounded-xl p-6 w-full max-w-sm mx-4">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold">Import Wallet</h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-700 rounded">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Enter Seed Phrase</label>
            <div className="relative">
              <textarea
                value={seedPhrase}
                onChange={(e) => setSeedPhrase(e.target.value)}
                placeholder="Enter your 12 or 24 word seed phrase..."
                className="w-full h-32 bg-crypto-dark p-3 rounded-lg text-sm resize-none"
              />
              <button
                onClick={() => setShowSeedPhrase(!showSeedPhrase)}
                className="absolute right-2 top-2"
              >
                {showSeedPhrase ? (
                  <EyeOff className="w-4 h-4 text-gray-400" />
                ) : (
                  <Eye className="w-4 h-4 text-gray-400" />
                )}
              </button>
            </div>
          </div>

          <div className="flex gap-4">
            <button onClick={onClose} className="flex-1 btn-secondary">
              Cancel
            </button>
            <button
              onClick={handleImport}
              disabled={isLoading}
              className="flex-1 btn-primary"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Importing...
                </>
              ) : (
                'Import Wallet'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 