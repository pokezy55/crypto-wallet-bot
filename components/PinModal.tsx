'use client'

import { useState, useEffect } from 'react'
import { X, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'

interface PinModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (pin: string) => Promise<{ success: boolean, error?: string, details?: string }>
  title?: string
  description?: string
  confirmText?: string
}

export default function PinModal({
  isOpen,
  onClose,
  onSubmit,
  title = 'Enter PIN',
  description = 'Please enter your 4-digit PIN to continue',
  confirmText = 'Confirm'
}: PinModalProps) {
  const [pin, setPin] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  
  // Reset state when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setPin('')
      setError('')
      setLoading(false)
    }
  }, [isOpen])

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
      const result = await onSubmit(pin)
      
      if (result.success) {
        onClose()
      } else {
        // Tampilkan error yang lebih spesifik
        if (result.error === 'Invalid PIN') {
          setError('PIN tidak valid')
          toast.error('PIN tidak valid')
        } else if (result.error?.includes('Failed to generate private key')) {
          setError('Gagal membuka private key, coba lagi')
          toast.error('Gagal membuka private key, coba lagi')
          console.error('Private key error details:', result.details)
        } else {
          setError(result.error || 'Terjadi kesalahan')
          toast.error(result.error || 'Terjadi kesalahan')
        }
      }
    } catch (error) {
      console.error('Error submitting PIN:', error)
      setError('Terjadi kesalahan. Silakan coba lagi.')
      toast.error('Terjadi kesalahan. Silakan coba lagi.')
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
        
        <h3 className="text-xl font-medium mb-4">{title}</h3>
        <p className="text-gray-400 mb-6">{description}</p>
        
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label htmlFor="pin" className="block text-sm font-medium mb-1">
                PIN
              </label>
              <input
                id="pin"
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
                <p className="text-red-500 text-sm mt-1">{error}</p>
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
                confirmText
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
} 