'use client'

import { useState, useEffect } from 'react'
import { X, Loader2 } from 'lucide-react'

interface ChangePinModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (currentPin: string, newPin: string) => Promise<{ success: boolean, error?: string }>
  isFirstTime?: boolean
}

export default function ChangePinModal({
  isOpen,
  onClose,
  onSubmit,
  isFirstTime = false
}: ChangePinModalProps) {
  const [currentPin, setCurrentPin] = useState('')
  const [newPin, setNewPin] = useState('')
  const [confirmPin, setConfirmPin] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState(isFirstTime ? 0 : 0)
  
  // Reset state when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setCurrentPin('')
      setNewPin('')
      setConfirmPin('')
      setError('')
      setLoading(false)
      setStep(isFirstTime ? 0 : 0)
    }
  }, [isOpen, isFirstTime])

  // Handle PIN input
  const handlePinChange = (setter: React.Dispatch<React.SetStateAction<string>>) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    // Ensure only numbers and max 4 digits
    if (/^\d*$/.test(value) && value.length <= 4) {
      setter(value)
      setError('')
    }
  }

  // Handle next step
  const handleNextStep = () => {
    if (step === 0 && newPin.length === 4) {
      setStep(1)
    }
  }

  // Handle PIN submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (step === 0 && newPin.length === 4) {
      setStep(1)
      return
    }
    
    if (newPin !== confirmPin) {
      setError('PIN tidak cocok')
      return
    }
    
    setLoading(true)
    setError('')
    
    try {
      const result = await onSubmit(isFirstTime ? '' : currentPin, newPin)
      
      if (result.success) {
        onClose()
      } else {
        if (result.error?.includes('Current PIN')) {
          setStep(0)
          setCurrentPin('')
        }
        setError(result.error || 'Gagal mengubah PIN')
      }
    } catch (error) {
      console.error('Error changing PIN:', error)
      setError('Terjadi kesalahan. Silakan coba lagi.')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="card max-w-md w-full relative">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white"
          disabled={loading}
        >
          <X className="w-5 h-5" />
        </button>
        
        <h3 className="text-xl font-medium mb-4">
          {isFirstTime ? 'Buat PIN' : 'Ubah PIN'}
        </h3>
        
        <form onSubmit={handleSubmit}>
          <div className="space-y-6">
            {/* Step 0: Current PIN (skip if first time) */}
            {step === 0 && !isFirstTime && (
              <div>
                <p className="text-gray-400 mb-4">Masukkan PIN saat ini</p>
                <div>
                  <label htmlFor="current-pin" className="block text-sm font-medium mb-1">
                    PIN Saat Ini
                  </label>
                  <input
                    id="current-pin"
                    type="password"
                    value={currentPin}
                    onChange={handlePinChange(setCurrentPin)}
                    placeholder="Masukkan PIN saat ini"
                    className="input-field w-full text-center text-2xl tracking-widest"
                    autoFocus
                    maxLength={4}
                    disabled={loading}
                  />
                </div>
              </div>
            )}
            
            {/* Step 0 (first time) or Step 1: New PIN */}
            {(step === 0 && isFirstTime) || (step === 0 && !isFirstTime && currentPin.length === 4) || step === 1 ? (
              <div>
                <p className="text-gray-400 mb-4">
                  {isFirstTime 
                    ? 'Buat PIN 4 digit untuk mengamankan wallet Anda' 
                    : 'Masukkan PIN 4 digit baru'}
                </p>
                <div>
                  <label htmlFor="new-pin" className="block text-sm font-medium mb-1">
                    PIN Baru
                  </label>
                  <input
                    id="new-pin"
                    type="password"
                    value={newPin}
                    onChange={handlePinChange(setNewPin)}
                    placeholder="Masukkan PIN baru"
                    className="input-field w-full text-center text-2xl tracking-widest"
                    autoFocus={isFirstTime || step === 1}
                    maxLength={4}
                    disabled={loading}
                  />
                </div>
              </div>
            ) : null}
            
            {/* Step 1 (first time) or Step 2: Confirm PIN */}
            {step === 1 && (
              <div>
                <p className="text-gray-400 mb-4">Konfirmasi PIN baru Anda</p>
                <div>
                  <label htmlFor="confirm-pin" className="block text-sm font-medium mb-1">
                    Konfirmasi PIN
                  </label>
                  <input
                    id="confirm-pin"
                    type="password"
                    value={confirmPin}
                    onChange={handlePinChange(setConfirmPin)}
                    placeholder="Konfirmasi PIN baru"
                    className="input-field w-full text-center text-2xl tracking-widest"
                    autoFocus
                    maxLength={4}
                    disabled={loading}
                  />
                </div>
              </div>
            )}
            
            {error && (
              <p className="text-red-500 text-sm">{error}</p>
            )}
            
            <button
              type="submit"
              className="btn-primary w-full"
              disabled={(step === 0 && !isFirstTime && currentPin.length !== 4) || 
                       (((step === 0 && isFirstTime) || step === 1) && newPin.length !== 4) || 
                       (step === 1 && confirmPin.length !== 4) || 
                       loading}
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin mx-auto" />
              ) : step === 0 && !isFirstTime ? (
                'Lanjut'
              ) : step === 0 && isFirstTime ? (
                'Lanjut'
              ) : (
                isFirstTime ? 'Buat PIN' : 'Ubah PIN'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
} 