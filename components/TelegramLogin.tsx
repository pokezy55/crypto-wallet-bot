'use client'

import React from 'react';
import { useEffect } from 'react'
import { Wallet } from 'lucide-react'

interface User {
  id: number
  first_name: string
  last_name?: string
  username?: string
  photo_url?: string
}

interface TelegramLoginProps {
  onAuth: (user: User) => void;
}

export default function TelegramLogin({ onAuth }: TelegramLoginProps) {
  useEffect(() => {
    // Check if we're in Telegram WebApp
    if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
      const telegramUser = window.Telegram.WebApp.initDataUnsafe.user
      if (telegramUser) {
        onAuth(telegramUser)
      }
    }
  }, [onAuth])

  return (
    <div className="min-h-screen bg-crypto-dark flex flex-col items-center justify-center p-6">
      {/* Logo */}
      <div className="mb-8">
        <div className="w-24 h-24 bg-gradient-to-br from-primary-500 to-primary-700 rounded-full flex items-center justify-center mb-4">
          <Wallet className="w-12 h-12 text-white" />
        </div>
        <h1 className="text-2xl font-bold text-white text-center">Crypto Wallet Bot</h1>
      </div>

      {/* Login Message */}
      <div className="text-center mb-8 max-w-md">
        <p className="text-gray-300 mb-4">
          Please open this app from Telegram to continue.
        </p>
        <p className="text-sm text-gray-400">
          This app requires Telegram authentication to access your crypto wallet.
        </p>
      </div>

      {/* Loading Indicator */}
      <div className="flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
        <span className="ml-3 text-gray-400">Connecting to Telegram...</span>
      </div>
    </div>
  )
} 