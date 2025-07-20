'use client'

import { useState, useEffect } from 'react'
import { Copy, Users, DollarSign, Loader2, Check } from 'lucide-react'
import toast from 'react-hot-toast'

interface User {
  id: number
  first_name: string
  last_name?: string
  username?: string
  photo_url?: string
  referral_code?: string
  referred_by?: number
  custom_code?: string
}

interface Referral {
  username: string
  address: string
  joinedAt: string
  isValid: boolean
  rewardStatus: string
}

interface ReferralStats {
  totalReferrals: number
  totalEarned: number
  referralCode: string
}

interface ReferralTabProps {
  user: User
  wallet?: {
    address: string
  }
  onUpdateReferralStatus?: (referredBy: number) => void
  onUpdateCustomCode?: (customCode: string) => void
}

export default function ReferralTab({ user, wallet, onUpdateReferralStatus, onUpdateCustomCode }: ReferralTabProps) {
  const [referrals, setReferrals] = useState<Referral[]>([])
  const [stats, setStats] = useState<ReferralStats>({
    totalReferrals: 0,
    totalEarned: 0,
    referralCode: ''
  })
  const [loading, setLoading] = useState(true)
  const [friendCode, setFriendCode] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [cooldown, setCooldown] = useState(0)
  const [referredBy, setReferredBy] = useState(user.referred_by)
  
  // Custom code state
  const [customCode, setCustomCode] = useState('')
  const [settingCode, setSettingCode] = useState(false)
  const [codeError, setCodeError] = useState('')

  // Get referral link using only custom code
  const referralLink = user.custom_code 
    ? `https://t.me/cointwobot/wallet?start=${user.custom_code}`
    : ''

  // Fetch referral data
  useEffect(() => {
    const fetchReferralData = async () => {
      setLoading(true)
      try {
        const res = await fetch(`/api/referral/progress?user=${user.id}`)
        if (!res.ok) {
          throw new Error('Failed to fetch referral data')
        }
        const data = await res.json()
        setReferrals(data.referrals || [])
        setStats(data.stats || {
          totalReferrals: 0,
          totalEarned: 0,
          referralCode: ''
        })
      } catch (error) {
        console.error('Error fetching referral data:', error)
        toast.error('Failed to load referral data')
      } finally {
        setLoading(false)
      }
    }

    fetchReferralData()
  }, [user.id])

  // Cooldown timer
  useEffect(() => {
    if (cooldown > 0) {
      const timer = setTimeout(() => {
        setCooldown(cooldown - 1)
      }, 1000)
      return () => clearTimeout(timer)
    }
  }, [cooldown])

  const copyReferralCode = () => {
    if (!user.custom_code) return
    navigator.clipboard.writeText(user.custom_code)
    toast.success('Referral code copied!')
  }
  
  const copyReferralLink = () => {
    if (!referralLink) return
    navigator.clipboard.writeText(referralLink)
    toast.success('Referral link copied!')
  }

  const submitFriendCode = async () => {
    if (!friendCode || submitting || cooldown > 0 || !wallet) return
    
    setSubmitting(true)
    setCooldown(10) // 10 second cooldown
    
    try {
      const res = await fetch('/api/referral/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userAddress: wallet.address,
          friendCode
        }),
      })
      
      const data = await res.json()
      
      if (!res.ok) {
        throw new Error(data.error || 'Failed to submit referral code')
      }
      
      toast.success('Referral code submitted successfully!')
      setReferredBy(data.referredBy)
      setFriendCode('')
      
      // Update parent component
      if (onUpdateReferralStatus && data.referredBy) {
        onUpdateReferralStatus(data.referredBy)
      }
    } catch (error: any) {
      console.error('Error submitting referral code:', error)
      toast.error(error.message || 'Failed to submit referral code')
    } finally {
      setSubmitting(false)
    }
  }
  
  const setCustomReferralCode = async () => {
    if (!customCode || settingCode || cooldown > 0 || !wallet) return
    
    // Validate code format
    const codeRegex = /^[a-zA-Z0-9_]{4,12}$/;
    if (!codeRegex.test(customCode)) {
      setCodeError('Use 4-12 characters (letters, numbers, underscore)')
      return
    }
    
    setSettingCode(true)
    setCooldown(10) // 10 second cooldown
    setCodeError('')
    
    try {
      const res = await fetch('/api/referral/set-code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userAddress: wallet.address,
          code: customCode
        }),
      })
      
      const data = await res.json()
      
      if (!res.ok) {
        throw new Error(data.error || 'Failed to set custom code')
      }
      
      toast.success('Referral code set successfully!')
      
      // Update parent component
      if (onUpdateCustomCode && data.customCode) {
        onUpdateCustomCode(data.customCode)
      }
      
      setCustomCode('')
    } catch (error: any) {
      console.error('Error setting custom code:', error)
      setCodeError(error.message || 'Failed to set custom code')
      toast.error(error.message || 'Failed to set custom code')
    } finally {
      setSettingCode(false)
    }
  }

  return (
    <div className="p-6">
      <h2 className="text-xl font-semibold mb-6">Referral Program</h2>

      {loading ? (
        <div className="flex justify-center items-center py-10">
          <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
        </div>
      ) : (
        <>
          {/* Referral Stats */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="card text-center">
              <Users className="w-8 h-8 mx-auto mb-2 text-primary-500" />
              <div className="text-2xl font-bold">{stats.totalReferrals}</div>
              <div className="text-sm text-gray-400">Total Referrals</div>
            </div>
            
            <div className="card text-center">
              <DollarSign className="w-8 h-8 mx-auto mb-2 text-green-500" />
              <div className="text-2xl font-bold">${stats.totalEarned.toFixed(1)}</div>
              <div className="text-sm text-gray-400">Total Earned</div>
            </div>
          </div>

          {/* Your Referral Code */}
          <div className="card mb-6">
            <h3 className="text-lg font-medium mb-4">Your Referral Code</h3>
            
            {user.custom_code ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={user.custom_code}
                    readOnly
                    className="input-field flex-1 text-sm"
                  />
                  <button
                    onClick={copyReferralCode}
                    className="p-2 bg-primary-600 rounded-lg hover:bg-primary-700"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={referralLink}
                    readOnly
                    className="input-field flex-1 text-sm"
                  />
                  <button
                    onClick={copyReferralLink}
                    className="p-2 bg-primary-600 rounded-lg hover:bg-primary-700"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <h4 className="text-sm font-medium mb-2">Set Your Referral Code</h4>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={customCode}
                    onChange={(e) => {
                      setCustomCode(e.target.value);
                      setCodeError('');
                    }}
                    placeholder="4-12 characters (letters, numbers, underscore)"
                    className="input-field flex-1 text-sm"
                    disabled={settingCode}
                    maxLength={12}
                  />
                  <button
                    onClick={setCustomReferralCode}
                    disabled={!customCode || settingCode || cooldown > 0}
                    className={`p-2 rounded-lg ${
                      !customCode || settingCode || cooldown > 0
                        ? 'bg-gray-600 cursor-not-allowed'
                        : 'bg-primary-600 hover:bg-primary-700'
                    }`}
                  >
                    {settingCode ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : cooldown > 0 ? (
                      <span className="text-xs px-1">{cooldown}s</span>
                    ) : (
                      <Check className="w-4 h-4" />
                    )}
                  </button>
                </div>
                {codeError && <p className="text-red-500 text-xs mt-1">{codeError}</p>}
                <p className="text-xs text-gray-400 mt-1">
                  You can only set your referral code once. Choose carefully!
                </p>
              </div>
            )}
          </div>

          {/* Friend Code Input */}
          {!referredBy && (
            <div className="card mb-6">
              <h3 className="text-lg font-medium mb-4">Got Invited?</h3>
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={friendCode}
                    onChange={(e) => setFriendCode(e.target.value)}
                    placeholder="Enter friend's referral code"
                    className="input-field flex-1 text-sm"
                    disabled={submitting}
                  />
                  <button
                    onClick={submitFriendCode}
                    disabled={!friendCode || submitting || cooldown > 0}
                    className={`p-2 rounded-lg ${
                      !friendCode || submitting || cooldown > 0
                        ? 'bg-gray-600 cursor-not-allowed'
                        : 'bg-primary-600 hover:bg-primary-700'
                    }`}
                  >
                    {submitting ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : cooldown > 0 ? (
                      <span className="text-xs px-1">{cooldown}s</span>
                    ) : (
                      <Check className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Referral Rewards Info */}
          <div className="card mb-6">
            <h3 className="text-lg font-medium mb-4">Referral Rewards</h3>
            <div className="space-y-2 text-sm">
              <p>Invite friends to earn rewards:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>$0.5 for each valid referral</li>
                <li>Friends must complete deposit and swap tasks</li>
                <li>Rewards are added automatically</li>
              </ul>
            </div>
          </div>

          {/* Referral List */}
          <div className="card">
            <h3 className="text-lg font-medium mb-4">Your Referrals</h3>
            {referrals.length === 0 ? (
              <p className="text-gray-400 text-center py-4">No referrals yet. Share your code to start earning!</p>
            ) : (
              <div className="space-y-3">
                {referrals.map((referral, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-crypto-dark rounded-lg">
                    <div>
                      <p className="font-medium">{referral.username}</p>
                      <p className="text-sm text-gray-400">Joined {new Date(referral.joinedAt).toLocaleDateString()}</p>
                    </div>
                    <div className="text-right">
                      <span className={`text-sm px-2 py-1 rounded-full ${
                        referral.isValid 
                          ? 'bg-green-900 text-green-400' 
                          : 'bg-yellow-900 text-yellow-400'
                      }`}>
                        {referral.isValid ? 'Completed' : 'Pending'}
                      </span>
                      {referral.isValid && (
                        <p className="text-xs text-green-400 mt-1">+$0.5 earned</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
} 