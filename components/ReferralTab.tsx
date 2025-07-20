'use client'

import { useState, useEffect } from 'react'
import { Copy, Users, DollarSign, Share2, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'

interface User {
  id: number
  first_name: string
  last_name?: string
  username?: string
  photo_url?: string
}

interface ReferralTabProps {
  user: User
}

interface Referral {
  username: string
  address?: string
  joinedAt: string
  isValid: boolean
  rewardStatus?: string
}

interface ReferralStats {
  totalReferrals: number
  totalEarned: number
  referralCode: string
}

export default function ReferralTab({ user }: ReferralTabProps) {
  const [referrals, setReferrals] = useState<Referral[]>([])
  const [stats, setStats] = useState<ReferralStats>({
    totalReferrals: 0,
    totalEarned: 0,
    referralCode: ''
  })
  const [loading, setLoading] = useState(true)
  const [manualRefCode, setManualRefCode] = useState('')
  const [submittingRefCode, setSubmittingRefCode] = useState(false)

  // Get referral code from Telegram WebApp or user ID
  const getTelegramUsername = () => {
    try {
      if (typeof window !== 'undefined' && window.Telegram?.WebApp?.initDataUnsafe?.user?.username) {
        return window.Telegram.WebApp.initDataUnsafe.user.username;
      }
    } catch (e) {
      console.error('Error getting Telegram username:', e);
    }
    return null;
  }

  const referralCode = stats.referralCode || `REF${user.id}`
  const referralLink = `https://t.me/cointwobot/wallet?start=two${referralCode.replace('REF', '')}`

  // Submit manual referral code
  const submitReferralCode = async () => {
    if (!manualRefCode || manualRefCode.trim() === '') {
      toast.error('Please enter a referral code')
      return
    }

    setSubmittingRefCode(true)
    try {
      // Add a small delay to simulate API call
      await new Promise(resolve => setTimeout(resolve, 500))
      
      const response = await fetch('/api/referral/track', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          referralCode: manualRefCode.trim(),
          userId: user.id,
          walletAddress: '' // This will be filled by backend
        }),
      })
      
      if (response.ok) {
        toast.success('Referral code applied successfully!')
        setManualRefCode('')
      } else {
        const data = await response.json()
        toast.error(data.error || 'Failed to apply referral code')
      }
    } catch (error) {
      console.error('Error submitting referral code:', error)
      toast.error('Failed to apply referral code')
    } finally {
      setSubmittingRefCode(false)
    }
  }

  // Fetch referral data
  useEffect(() => {
    const fetchReferralData = async () => {
      setLoading(true)
      try {
        // Add a small delay to prevent immediate fetch
        await new Promise(resolve => setTimeout(resolve, 500));
        
        console.log('Fetching referral data for user:', user.id);
        const res = await fetch(`/api/referral/progress?user=${user.id}`, {
          // Add cache control to prevent browser caching
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
          }
        })
        
        if (!res.ok) {
          console.error('API returned error status:', res.status);
          throw new Error(`Failed to fetch referral data: ${res.status}`)
        }
        
        const data = await res.json()
        console.log('Referral data received:', data);
        
        // Check if data has the expected structure
        if (!data || typeof data !== 'object') {
          throw new Error('Invalid data format received');
        }
        
        setReferrals(data.referrals || [])
        setStats({
          totalReferrals: data.stats?.totalReferrals || 0,
          totalEarned: data.stats?.totalEarned || 0,
          referralCode: data.stats?.referralCode || `REF${user.id}`
        })
      } catch (error) {
        console.error('Error fetching referral data:', error)
        toast.error('Failed to load referral data')
        
        // Set default values on error
        setReferrals([])
        setStats({
          totalReferrals: 0,
          totalEarned: 0,
          referralCode: `REF${user.id}`
        })
      } finally {
        setLoading(false)
      }
    }

    if (user?.id) {
      fetchReferralData()
    } else {
      console.log('No user ID available, skipping referral data fetch');
      setLoading(false)
    }
  }, [user?.id])

  const copyReferralLink = () => {
    navigator.clipboard.writeText(referralLink)
    toast.success('Referral link copied!')
  }

  const shareReferralLink = () => {
    if (navigator.share) {
      navigator.share({
        title: 'Join Crypto Wallet Bot',
        text: 'Create your crypto wallet and earn rewards!',
        url: referralLink,
      })
    } else {
      copyReferralLink()
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

      {/* Referral Link */}
      <div className="card mb-6">
        <h3 className="text-lg font-medium mb-4">Your Referral Link</h3>
        <div className="space-y-3">
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
          
          <button
            onClick={shareReferralLink}
            className="w-full btn-primary flex items-center justify-center gap-2"
          >
            <Share2 className="w-4 h-4" />
            Share Referral Link
          </button>
        </div>
      </div>

          {/* Manual Referral Code Input */}
          <div className="card mb-6">
            <h3 className="text-lg font-medium mb-4">Apply Manual Referral Code</h3>
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={manualRefCode}
                  onChange={(e) => setManualRefCode(e.target.value)}
                  placeholder="Enter referral code"
                  className="input-field flex-1 text-sm"
                />
                <button
                  onClick={submitReferralCode}
                  disabled={submittingRefCode}
                  className="p-2 bg-primary-600 rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submittingRefCode ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Share2 className="w-4 h-4" />
                  )}
                </button>
              </div>
              <p className="text-sm text-gray-400">
                If you received a referral code from a friend, you can apply it here to earn rewards.
              </p>
            </div>
          </div>

      {/* Referral Rewards Info */}
      <div className="card mb-6">
        <h3 className="text-lg font-medium mb-4">How It Works</h3>
        <div className="space-y-3 text-sm">
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 bg-primary-600 rounded-full flex items-center justify-center text-xs font-bold mt-0.5">
              1
            </div>
            <div>
              <p className="font-medium">Share your referral link</p>
              <p className="text-gray-400">Send the link to friends and family</p>
            </div>
          </div>
          
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 bg-primary-600 rounded-full flex items-center justify-center text-xs font-bold mt-0.5">
              2
            </div>
            <div>
                  <p className="font-medium">They complete both tasks</p>
                  <p className="text-gray-400">Deposit ≥ $20 and Swap ≥ $10</p>
            </div>
          </div>
          
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 bg-primary-600 rounded-full flex items-center justify-center text-xs font-bold mt-0.5">
              3
            </div>
            <div>
              <p className="font-medium">Earn $0.5 USDT per valid referral</p>
              <p className="text-gray-400">Reward is automatically added to your wallet</p>
            </div>
          </div>
        </div>
      </div>

      {/* Referral List */}
      <div className="card">
        <h3 className="text-lg font-medium mb-4">Your Referrals</h3>
        {referrals.length === 0 ? (
          <p className="text-gray-400 text-center py-4">No referrals yet. Share your link to start earning!</p>
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