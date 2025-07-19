'use client'

import React from 'react';
import { Settings, LogOut, Key, ExternalLink } from 'lucide-react';
import toast from 'react-hot-toast';

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

interface MenuTabProps {
  wallet: Wallet | null;
  user: User | null;
}

export default function MenuTab({ wallet, user }: MenuTabProps) {
  const handleLogout = () => {
    // Clear local storage
    localStorage.clear();
    // Reload page
    window.location.reload();
  };

  const handleViewSeedPhrase = () => {
    if (wallet?.seedPhrase) {
      toast.success('Seed phrase copied to clipboard!');
      navigator.clipboard.writeText(wallet.seedPhrase);
    } else {
      toast.error('No seed phrase available');
    }
  };

  const handleViewOnExplorer = () => {
    if (wallet?.address) {
      window.open(`https://etherscan.io/address/${wallet.address}`, '_blank');
    }
  };

  return (
    <div className="p-4">
      {/* User Info */}
      <div className="flex items-center gap-4 mb-6">
        <div className="w-16 h-16 rounded-full bg-primary-500/20 flex items-center justify-center">
          {user?.photo_url ? (
            <img src={user.photo_url} alt={user.first_name} className="w-full h-full rounded-full" />
          ) : (
            <span className="text-2xl font-bold text-primary-500">
              {user?.first_name?.[0] || '?'}
            </span>
          )}
        </div>
        <div>
          <h2 className="text-lg font-semibold">
            {user?.first_name} {user?.last_name}
          </h2>
          <p className="text-sm text-gray-400">@{user?.username || 'anonymous'}</p>
        </div>
      </div>

      {/* Menu Items */}
      <div className="space-y-2">
        <button
          onClick={handleViewSeedPhrase}
          className="w-full p-4 bg-crypto-card border border-crypto-border rounded-lg flex items-center gap-3 hover:bg-crypto-border transition-colors"
        >
          <Key className="w-5 h-5 text-primary-500" />
          <span>View Seed Phrase</span>
        </button>

        <button
          onClick={handleViewOnExplorer}
          className="w-full p-4 bg-crypto-card border border-crypto-border rounded-lg flex items-center gap-3 hover:bg-crypto-border transition-colors"
        >
          <ExternalLink className="w-5 h-5 text-primary-500" />
          <span>View on Explorer</span>
        </button>

        <button
          onClick={handleLogout}
          className="w-full p-4 bg-crypto-card border border-crypto-border rounded-lg flex items-center gap-3 hover:bg-crypto-border transition-colors"
        >
          <LogOut className="w-5 h-5 text-red-500" />
          <span className="text-red-500">Logout</span>
        </button>
      </div>
    </div>
  );
} 