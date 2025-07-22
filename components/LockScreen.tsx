'use client'

import { useState, useEffect } from 'react'
import { Lock, Loader2, AlertCircle } from 'lucide-react'
import toast from 'react-hot-toast'
import { useSettings } from '@/lib/SettingsContext'

interface LockScreenProps {
  onUnlock: () => void
}

export default function LockScreen({ onUnlock }: LockScreenProps) {
  const [pin, setPin] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [attempts, setAttempts] = useState(0)
  const { verifyPin } = useSettings()

  // Handle PIN input
  const handlePinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    // Ensure only numbers and max 4 digits
    if (/^\d*$/.test(value) && value.length <= 4) {
      setPin(value)
      setError('')
    }
  }

  // Handle PIN submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (pin.length !== 4) {
      setError('PIN harus 4 digit')
      return
    }
    
    setLoading(true)
    setError('')
    
    try {
      // Ambil userId dari localStorage
      const userId = localStorage.getItem('userId')
      
      if (!userId) {
        setError('Sesi tidak valid. Silakan muat ulang aplikasi.')
        setLoading(false)
        return
      }
      
      const result = await verifyPin(parseInt(userId), pin)
      
      if (result.success) {
        toast.success('PIN valid')
        onUnlock()
      } else {
        // Tambah jumlah percobaan
        const newAttempts = attempts + 1
        setAttempts(newAttempts)
        
        // Tampilkan pesan error
        if (newAttempts >= 3) {
          setError('PIN salah. Sudah 3 kali percobaan.')
          toast.error('PIN salah. Sudah 3 kali percobaan.')
        } else {
          setError(`PIN salah. Percobaan ke-${newAttempts}`)
          toast.error('PIN salah')
        }
      }
    } catch (error) {
      console.error('Error verifying PIN:', error)
      setError('Terjadi kesalahan. Silakan coba lagi.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 flex flex-col items-center justify-center p-6 z-50">
      <div className="card max-w-md w-full bg-crypto-dark backdrop-blur-lg bg-opacity-80 border border-gray-800">
        <div className="flex flex-col items-center justify-center py-8 px-4">
          <div className="w-16 h-16 bg-primary-600/20 rounded-full flex items-center justify-center mb-6">
            <Lock className="w-8 h-8 text-primary-500" />
          </div>
          
          <h2 className="text-2xl font-bold mb-2">Wallet Terkunci</h2>
          <p className="text-gray-400 text-center mb-6">
            Masukkan PIN untuk membuka wallet Anda
          </p>
          
          <form onSubmit={handleSubmit} className="w-full max-w-xs">
            <div className="space-y-6">
              <div>
                <input
                  type="password"
                  value={pin}
                  onChange={handlePinChange}
                  placeholder="Masukkan PIN 4 digit"
                  className="input-field w-full text-center text-2xl tracking-widest"
                  autoFocus
                  maxLength={4}
                  disabled={loading}
                />
                {error && (
                  <div className="flex items-center gap-2 text-red-500 text-sm mt-2">
                    <AlertCircle className="w-4 h-4" />
                    <p>{error}</p>
                  </div>
                )}
              </div>
              
              <button
                type="submit"
                className="btn-primary w-full"
                disabled={pin.length !== 4 || loading}
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin mx-auto" />
                ) : (
                  'Buka Wallet'
                )}
              </button>
              
              {attempts >= 3 && (
                <div className="text-center mt-4">
                  <button
                    type="button"
                    onClick={() => {
                      if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
                        window.Telegram.WebApp.openTelegramLink('https://t.me/CoinTwoSupport')
                      } else {
                        window.open('https://t.me/CoinTwoSupport', '_blank')
                      }
                    }}
                    className="text-primary-500 hover:text-primary-400 text-sm"
                  >
                    Lupa PIN? Hubungi Admin
                  </button>
                </div>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  )
} 