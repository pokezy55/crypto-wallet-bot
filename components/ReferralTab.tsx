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
          referralCode: `REF${user.id}`
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