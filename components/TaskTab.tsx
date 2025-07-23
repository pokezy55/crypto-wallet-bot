'use client'

import { useState, useEffect } from 'react'
import { CheckCircle, XCircle, Gift, DollarSign, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { motion, AnimatePresence } from 'framer-motion'

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
  target?: number
  progress?: number
  rewardQuotaTotal?: number
  rewardQuotaRemaining?: number
}

type DepositProgress = {
  totalDepositUSD: number
  eligibleToClaim: boolean
  status: 'unclaimed' | 'eligible' | 'processing' | 'claimed'
  target: number
  progress: number
  rewardQuotaTotal?: number
  rewardQuotaRemaining?: number
}

export default function TaskTab({ user }: TaskTabProps) {
  const [swapProgress, setSwapProgress] = useState<SwapProgress | null>(null)
  const [depositProgress, setDepositProgress] = useState<DepositProgress | null>(null)
  const [loadingSwap, setLoadingSwap] = useState(true)
  const [loadingDeposit, setLoadingDeposit] = useState(true)
  const [claimingSwap, setClaimingSwap] = useState(false)
  const [claimingDeposit, setClaimingDeposit] = useState(false)

  // Fetch progress swap user (real, polling 5 detik)
  useEffect(() => {
    let lastSwap = 0;
    let lastStatus = '';
    let first = true;
    const fetchSwapStatus = async () => {
      setLoadingSwap(true);
      try {
        const res = await fetch(`/api/task/${user.id}/swap-status/`);
        const data = await res.json();
        setSwapProgress({
          totalSwapUSD: data.totalSwapUSD,
          eligibleToClaim: data.totalSwapUSD >= 20,
          status: data.status === 'completed' ? 'claimed' : (data.status === 'in_progress' ? 'unclaimed' : data.status),
          target: 20,
          progress: Math.min(100, (data.totalSwapUSD / 20) * 100),
        });
        if (!first) {
          if (data.totalSwapUSD > lastSwap) {
            toast.success(`Swap detected: +$${(data.totalSwapUSD - lastSwap).toFixed(2)}! Keep going…`);
          }
          if (data.status === 'completed' && lastStatus !== 'completed') {
            toast.success('Task Swap completed! Reward pending admin approval.');
          }
        }
        lastSwap = data.totalSwapUSD;
        lastStatus = data.status;
        first = false;
      } catch (e) {
        toast.error('Failed to fetch swap status');
      }
      setLoadingSwap(false);
    };
    fetchSwapStatus();
    const interval = setInterval(fetchSwapStatus, 5000);
    return () => clearInterval(interval);
  }, [user.id]);

  // Fetch progress deposit user (real, polling 5 detik)
  useEffect(() => {
    let lastDeposit = 0;
    let lastStatus = '';
    let first = true;
    const fetchDepositStatus = async () => {
      setLoadingDeposit(true);
      try {
        const res = await fetch(`/api/task/${user.id}/deposit-status/`);
        const data = await res.json();
        setDepositProgress({
          totalDepositUSD: data.totalDepositUSD,
          eligibleToClaim: data.totalDepositUSD >= 20,
          status: data.status === 'completed' ? 'claimed' : (data.status === 'in_progress' ? 'unclaimed' : data.status),
          target: 20,
          progress: Math.min(100, (data.totalDepositUSD / 20) * 100),
        });
        if (!first) {
          if (data.totalDepositUSD > lastDeposit) {
            toast.success(`Deposit detected: +$${(data.totalDepositUSD - lastDeposit).toFixed(2)}! Keep going…`);
          }
          if (data.status === 'completed' && lastStatus !== 'completed') {
            toast.success('Task Deposit completed! Reward pending admin approval.');
          }
        }
        lastDeposit = data.totalDepositUSD;
        lastStatus = data.status;
        first = false;
      } catch (e) {
        toast.error('Failed to fetch deposit status');
      }
      setLoadingDeposit(false);
    };
    fetchDepositStatus();
    const interval = setInterval(fetchDepositStatus, 5000);
    return () => clearInterval(interval);
  }, [user.id]);

  const handleClaimSwap = async () => {
    setClaimingSwap(true)
    try {
      const res = await fetch(`/api/task/${user.id}/swap-claim/`, { method: 'POST' })
      const data = await res.json()
      if (res.ok) {
        toast.success('Reward claim requested! Waiting for admin approval.')
        // No need to refetch swapProgress here, as the polling will handle it
      } else {
        toast.error(data.error || 'Failed to claim reward')
      }
    } catch (e) {
      toast.error('Network error')
    }
    setClaimingSwap(false)
  }

  const handleClaimDeposit = async () => {
    setClaimingDeposit(true)
    try {
      const res = await fetch(`/api/task/${user.id}/deposit-claim/`, { method: 'POST' })
      const data = await res.json()
      if (res.ok) {
        toast.success('Reward claim requested! Waiting for admin approval.')
        // No need to refetch depositProgress here, as the polling will handle it
      } else {
        toast.error(data.error || 'Failed to claim reward')
      }
    } catch (e) {
      toast.error('Network error')
    }
    setClaimingDeposit(false)
  }

  return (
    <div className="p-6">
      <h2 className="text-xl font-semibold mb-6">Tasks & Rewards</h2>
      
      {/* Swap Task Card */}
      <div className="card mb-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h3 className="text-lg font-medium mb-2">Complete Swap Task</h3>
            <p className="text-gray-400 text-sm mb-3">
              Swap tokens worth a total of $10 across any EVM network to earn rewards
            </p>
            <div className="flex items-center gap-2 text-sm">
              <span className="text-gray-400">Reward:</span>
              <span className="text-green-400 font-medium">$3 USDT</span>
              <Gift className="w-4 h-4 text-green-400" />
            </div>
          </div>
          <div className="ml-4">
            {swapProgress?.status === 'claimed' ? (
              <CheckCircle className="w-8 h-8 text-green-500" />
            ) : (
              <XCircle className="w-8 h-8 text-red-500" />
            )}
          </div>
        </div>
        <div className="space-y-3">
          <div className="flex justify-between items-center text-sm">
            <span className="text-gray-400">Task Status:</span>
            <span className={swapProgress?.status === 'claimed' || swapProgress?.status === 'eligible' || swapProgress?.status === 'processing' ? 'text-green-400' : 'text-red-400'}>
              {loadingSwap ? <Loader2 className="animate-spin w-4 h-4" /> :
                swapProgress?.status === 'claimed' ? 'Completed' :
                swapProgress?.status === 'processing' ? 'Processing' :
                swapProgress?.status === 'eligible' ? 'Completed' :
                'Incomplete'}
            </span>
          </div>
          <div className="flex justify-between items-center text-sm">
            <span className="text-gray-400">Reward Status:</span>
            <span className={swapProgress?.status === 'claimed' ? 'text-green-400' : swapProgress?.status === 'processing' ? 'text-yellow-400' : 'text-yellow-400'}>
              {loadingSwap ? <Loader2 className="animate-spin w-4 h-4" /> :
                <AnimatePresence mode="wait">
                  <motion.span
                    key={`${swapProgress?.rewardQuotaRemaining}/${swapProgress?.rewardQuotaTotal}`}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.3 }}
                  >
                    {typeof swapProgress?.rewardQuotaRemaining === 'number' && typeof swapProgress?.rewardQuotaTotal === 'number'
                      ? `${swapProgress.rewardQuotaRemaining}/${swapProgress.rewardQuotaTotal}`
                      : '-'}
                  </motion.span>
                </AnimatePresence>
              }
            </span>
          </div>
          <div className="flex justify-between items-center text-sm">
            <span className="text-gray-400">Total Swap:</span>
            <span className="text-blue-400">{swapProgress ? `${swapProgress.totalSwapUSD.toFixed(2)} / 20 USD` : '0.00 / 20 USD'}</span>
          </div>
          
          {/* Progress bar */}
          {swapProgress && (
            <div className="w-full bg-gray-700 rounded-full h-2.5 mt-2">
              <div 
                className="bg-primary-500 h-2.5 rounded-full" 
                style={{ width: `${swapProgress.progress}%` }}
              ></div>
            </div>
          )}
        </div>
        <div className="mt-4 pt-4 border-t border-crypto-border">
          {loadingSwap ? (
            <button className="w-full btn-primary" disabled>
              <Loader2 className="animate-spin w-4 h-4 mr-2 inline" /> Loading...
            </button>
          ) : swapProgress?.status === 'eligible' ? (
            <button
              onClick={handleClaimSwap}
              className="w-full btn-primary flex items-center justify-center gap-2"
              disabled={claimingSwap}
            >
              {claimingSwap ? <Loader2 className="animate-spin w-4 h-4" /> : <DollarSign className="w-4 h-4" />}
              CLAIM
            </button>
          ) : swapProgress?.status === 'processing' ? (
            <div className="text-center py-2 text-yellow-400">
              <Loader2 className="animate-spin w-6 h-6 mx-auto mb-2" />
              <span className="text-sm">Waiting for admin approval...</span>
            </div>
          ) : swapProgress?.status === 'claimed' ? (
            <div className="text-center py-2 text-green-400">
              <CheckCircle className="w-6 h-6 mx-auto mb-2" />
              <span className="text-sm">Reward claimed successfully!</span>
            </div>
          ) : (
            <button className="w-full btn-disabled" disabled>
              CLAIM
            </button>
          )}
        </div>
      </div>

      {/* Deposit Task Card */}
      <div className="card mb-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h3 className="text-lg font-medium mb-2">Complete Deposit Task</h3>
            <p className="text-gray-400 text-sm mb-3">
              Deposit tokens worth a total of $20 across any EVM network to earn rewards
            </p>
            <div className="flex items-center gap-2 text-sm">
              <span className="text-gray-400">Reward:</span>
              <span className="text-green-400 font-medium">$3 USDT</span>
              <Gift className="w-4 h-4 text-green-400" />
            </div>
          </div>
          <div className="ml-4">
            {depositProgress?.status === 'claimed' ? (
              <CheckCircle className="w-8 h-8 text-green-500" />
            ) : (
              <XCircle className="w-8 h-8 text-red-500" />
            )}
          </div>
        </div>
        <div className="space-y-3">
          <div className="flex justify-between items-center text-sm">
            <span className="text-gray-400">Task Status:</span>
            <span className={depositProgress?.status === 'claimed' || depositProgress?.status === 'eligible' || depositProgress?.status === 'processing' ? 'text-green-400' : 'text-red-400'}>
              {loadingDeposit ? <Loader2 className="animate-spin w-4 h-4" /> :
                depositProgress?.status === 'claimed' ? 'Completed' :
                depositProgress?.status === 'processing' ? 'Processing' :
                depositProgress?.status === 'eligible' ? 'Completed' :
                'Incomplete'}
            </span>
          </div>
          <div className="flex justify-between items-center text-sm">
            <span className="text-gray-400">Reward Status:</span>
            <span className={depositProgress?.status === 'claimed' ? 'text-green-400' : depositProgress?.status === 'processing' ? 'text-yellow-400' : 'text-yellow-400'}>
              {loadingDeposit ? <Loader2 className="animate-spin w-4 h-4" /> :
                <AnimatePresence mode="wait">
                  <motion.span
                    key={`${depositProgress?.rewardQuotaRemaining}/${depositProgress?.rewardQuotaTotal}`}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.3 }}
                  >
                    {typeof depositProgress?.rewardQuotaRemaining === 'number' && typeof depositProgress?.rewardQuotaTotal === 'number'
                      ? `${depositProgress.rewardQuotaRemaining}/${depositProgress.rewardQuotaTotal}`
                      : '-'}
                  </motion.span>
                </AnimatePresence>
              }
            </span>
          </div>
          <div className="flex justify-between items-center text-sm">
            <span className="text-gray-400">Total Deposit:</span>
            <span className="text-blue-400">{depositProgress ? `${depositProgress.totalDepositUSD.toFixed(2)} / 20 USD` : '0.00 / 20 USD'}</span>
          </div>
          
          {/* Progress bar */}
          {depositProgress && (
            <div className="w-full bg-gray-700 rounded-full h-2.5 mt-2">
              <div 
                className="bg-primary-500 h-2.5 rounded-full" 
                style={{ width: `${depositProgress.progress}%` }}
              ></div>
            </div>
          )}
        </div>
        <div className="mt-4 pt-4 border-t border-crypto-border">
          {loadingDeposit ? (
            <button className="w-full btn-primary" disabled>
              <Loader2 className="animate-spin w-4 h-4 mr-2 inline" /> Loading...
            </button>
          ) : depositProgress?.status === 'eligible' ? (
            <button
              onClick={handleClaimDeposit}
              className="w-full btn-primary flex items-center justify-center gap-2"
              disabled={claimingDeposit}
            >
              {claimingDeposit ? <Loader2 className="animate-spin w-4 h-4" /> : <DollarSign className="w-4 h-4" />}
              CLAIM
            </button>
          ) : depositProgress?.status === 'processing' ? (
            <div className="text-center py-2 text-yellow-400">
              <Loader2 className="animate-spin w-6 h-6 mx-auto mb-2" />
              <span className="text-sm">Waiting for admin approval...</span>
            </div>
          ) : depositProgress?.status === 'claimed' ? (
            <div className="text-center py-2 text-green-400">
              <CheckCircle className="w-6 h-6 mx-auto mb-2" />
              <span className="text-sm">Reward claimed successfully!</span>
            </div>
          ) : (
            <button className="w-full btn-disabled" disabled>
              CLAIM
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
            <span>Swap and deposit can be done on any EVM-compatible network (Ethereum, BSC, Polygon, etc.)</span>
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