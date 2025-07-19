'use client'

import { useState, useEffect } from 'react'
import { CheckCircle, XCircle, Gift, DollarSign, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'

interface User {
  id: number
  first_name: string
  last_name?: string
  username?: string
  photo_url?: string
}

interface TaskTabProps {
  user: User
}

type SwapProgress = {
  totalSwapUSD: number
  eligibleToClaim: boolean
  status: 'unclaimed' | 'eligible' | 'processing' | 'claimed'
}

export default function TaskTab({ user }: TaskTabProps) {
  const [progress, setProgress] = useState<SwapProgress | null>(null)
  const [loading, setLoading] = useState(true)
  const [claiming, setClaiming] = useState(false)

  // Fetch progress swap user
  const fetchProgress = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/task/${user.id}/swap-progress`)
      const data = await res.json()
      setProgress(data)
    } catch (e) {
      toast.error('Failed to fetch swap progress')
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchProgress()
    // Polling setiap 10 detik jika status processing
    let interval: NodeJS.Timeout | undefined
    if (progress?.status === 'processing') {
      interval = setInterval(fetchProgress, 10000)
    }
    return () => interval && clearInterval(interval)
    // eslint-disable-next-line
  }, [user.id, progress?.status])

  const handleClaim = async () => {
    setClaiming(true)
    try {
      const res = await fetch(`/api/task/${user.id}/swap-claim`, { method: 'POST' })
      const data = await res.json()
      if (res.ok) {
        toast.success('Reward claim requested! Waiting for admin approval.')
        fetchProgress()
      } else {
        toast.error(data.error || 'Failed to claim reward')
      }
    } catch (e) {
      toast.error('Network error')
    }
    setClaiming(false)
  }

  return (
    <div className="p-6">
      <h2 className="text-xl font-semibold mb-6">Tasks & Rewards</h2>
      <div className="card mb-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h3 className="text-lg font-medium mb-2">Complete Swap Task</h3>
            <p className="text-gray-400 text-sm mb-3">
              Swap tokens worth a total of $10 across any EVM network to earn rewards
            </p>
            <div className="flex items-center gap-2 text-sm">
              <span className="text-gray-400">Reward:</span>
              <span className="text-green-400 font-medium">$5 USDT</span>
              <Gift className="w-4 h-4 text-green-400" />
            </div>
          </div>
          <div className="ml-4">
            {progress?.status === 'claimed' ? (
              <CheckCircle className="w-8 h-8 text-green-500" />
            ) : (
              <XCircle className="w-8 h-8 text-red-500" />
            )}
          </div>
        </div>
        <div className="space-y-3">
          <div className="flex justify-between items-center text-sm">
            <span className="text-gray-400">Task Status:</span>
            <span className={progress?.status === 'claimed' || progress?.status === 'eligible' || progress?.status === 'processing' ? 'text-green-400' : 'text-red-400'}>
              {loading ? <Loader2 className="animate-spin w-4 h-4" /> :
                progress?.status === 'claimed' ? 'Claimed' :
                progress?.status === 'processing' ? 'Processing' :
                progress?.status === 'eligible' ? 'Completed' :
                'Incomplete'}
            </span>
          </div>
          <div className="flex justify-between items-center text-sm">
            <span className="text-gray-400">Reward Status:</span>
            <span className={progress?.status === 'claimed' ? 'text-green-400' : progress?.status === 'processing' ? 'text-yellow-400' : 'text-yellow-400'}>
              {loading ? <Loader2 className="animate-spin w-4 h-4" /> :
                progress?.status === 'claimed' ? 'Claimed' :
                progress?.status === 'processing' ? 'Processing' :
                progress?.status === 'eligible' ? 'Available' :
                'Available'}
            </span>
          </div>
          <div className="flex justify-between items-center text-sm">
            <span className="text-gray-400">Total Swap:</span>
            <span className="text-blue-400">${progress?.totalSwapUSD?.toFixed(2) || '0.00'}</span>
          </div>
        </div>
        <div className="mt-4 pt-4 border-t border-crypto-border">
          {loading ? (
            <button className="w-full btn-primary" disabled>
              <Loader2 className="animate-spin w-4 h-4 mr-2 inline" /> Loading...
            </button>
          ) : progress?.status === 'eligible' ? (
            <button
              onClick={handleClaim}
              className="w-full btn-primary flex items-center justify-center gap-2"
              disabled={claiming}
            >
              {claiming ? <Loader2 className="animate-spin w-4 h-4" /> : <DollarSign className="w-4 h-4" />}
              Claim $5 USDT Reward
            </button>
          ) : progress?.status === 'processing' ? (
            <div className="text-center py-2 text-yellow-400">
              <Loader2 className="animate-spin w-6 h-6 mx-auto mb-2" />
              <span className="text-sm">Waiting for admin approval...</span>
            </div>
          ) : progress?.status === 'claimed' ? (
            <div className="text-center py-2 text-green-400">
              <CheckCircle className="w-6 h-6 mx-auto mb-2" />
              <span className="text-sm">Reward claimed successfully!</span>
            </div>
          ) : (
            <button className="w-full btn-primary" disabled>
              Mark as Complete
            </button>
          )}
        </div>
      </div>
      {/* Task Rules */}
      <div className="card">
        <h3 className="text-lg font-medium mb-4">Task Rules</h3>
        <ul className="space-y-2 text-sm text-gray-300">
          <li className="flex items-start gap-2">
            <span className="text-primary-500 mt-1">•</span>
            <span>Swap can be done on any EVM-compatible network (Ethereum, BSC, Polygon, etc.)</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-primary-500 mt-1">•</span>
            <span>Total swap value must be at least $10 USD equivalent</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-primary-500 mt-1">•</span>
            <span>One reward per user account</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-primary-500 mt-1">•</span>
            <span>Reward is automatically added to your wallet balance</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-primary-500 mt-1">•</span>
            <span>Task completion is verified by our system</span>
          </li>
        </ul>
      </div>
    </div>
  )
} 