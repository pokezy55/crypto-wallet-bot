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
  const [step, setStep] = useState(isFirstTime ? 1 : 0)
  
  // Reset state when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setCurrentPin('')
      setNewPin('')
      setConfirmPin('')
      setError('')
      setLoading(false)
      setStep(isFirstTime ? 1 : 0)
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
    if (step === 0 && currentPin.length === 4) {
      setStep(1)
    } else if (step === 1 && newPin.length === 4) {
      setStep(2)
    }
  }

  // Handle PIN submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (step === 0 && currentPin.length === 4) {
      setStep(1)
      return
    }
    
    if (step === 1 && newPin.length === 4) {
      setStep(2)
      return
    }
    
    if (newPin !== confirmPin) {
      setError('PINs do not match')
      return
    }
    
    setLoading(true)
    setError('')
    
    try {
      const result = await onSubmit(isFirstTime ? '0000' : currentPin, newPin)
      
      if (result.success) {
        onClose()
      } else {
        if (result.error?.includes('Current PIN')) {
          setStep(0)
          setCurrentPin('')
        }
        setError(result.error || 'Failed to change PIN')
      }
    } catch (error) {
      console.error('Error changing PIN:', error)
      setError('An error occurred. Please try again.')
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
          {isFirstTime ? 'Set PIN' : 'Change PIN'}
        </h3>
        
        <form onSubmit={handleSubmit}>
          <div className="space-y-6">
            {/* Step 0: Current PIN (skip if first time) */}
            {step === 0 && !isFirstTime && (
              <div>
                <p className="text-gray-400 mb-4">Enter your current PIN</p>
                <div>
                  <label htmlFor="current-pin" className="block text-sm font-medium mb-1">
                    Current PIN
                  </label>
                  <input
                    id="current-pin"
                    type="password"
                    value={currentPin}
                    onChange={handlePinChange(setCurrentPin)}
                    placeholder="Enter current PIN"
                    className="input-field w-full text-center text-2xl tracking-widest"
                    autoFocus
                    maxLength={4}
                    disabled={loading}
                  />
                </div>
              </div>
            )}
            
            {/* Step 1: New PIN */}
            {step === 1 && (
              <div>
                <p className="text-gray-400 mb-4">
                  {isFirstTime 
                    ? 'Create a 4-digit PIN to secure your wallet' 
                    : 'Enter your new 4-digit PIN'}
                </p>
                <div>
                  <label htmlFor="new-pin" className="block text-sm font-medium mb-1">
                    New PIN
                  </label>
                  <input
                    id="new-pin"
                    type="password"
                    value={newPin}
                    onChange={handlePinChange(setNewPin)}
                    placeholder="Enter new PIN"
                    className="input-field w-full text-center text-2xl tracking-widest"
                    autoFocus
                    maxLength={4}
                    disabled={loading}
                  />
                </div>
              </div>
            )}
            
            {/* Step 2: Confirm PIN */}
            {step === 2 && (
              <div>
                <p className="text-gray-400 mb-4">Confirm your new PIN</p>
                <div>
                  <label htmlFor="confirm-pin" className="block text-sm font-medium mb-1">
                    Confirm PIN
                  </label>
                  <input
                    id="confirm-pin"
                    type="password"
                    value={confirmPin}
                    onChange={handlePinChange(setConfirmPin)}
                    placeholder="Confirm new PIN"
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
              disabled={(step === 0 && currentPin.length !== 4) || 
                       (step === 1 && newPin.length !== 4) || 
                       (step === 2 && confirmPin.length !== 4) || 
                       loading}
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin mx-auto" />
              ) : step < 2 ? (
                'Next'
              ) : (
                isFirstTime ? 'Set PIN' : 'Change PIN'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
} 