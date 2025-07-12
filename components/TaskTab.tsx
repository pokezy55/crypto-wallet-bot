'use client'

import { useState } from 'react'
import { CheckCircle, XCircle, Gift, DollarSign } from 'lucide-react'
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

export default function TaskTab({ user }: TaskTabProps) {
  const [taskCompleted, setTaskCompleted] = useState(false)
  const [rewardClaimed, setRewardClaimed] = useState(false)

  const handleClaimReward = async () => {
    if (!taskCompleted) {
      toast.error('Complete the task first!')
      return
    }
    
    if (rewardClaimed) {
      toast.error('Reward already claimed!')
      return
    }

    try {
      const response = await fetch('/api/task/claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ taskId: 1 }) // In real app, get actual taskId
      });
      
      if (response.ok) {
        setRewardClaimed(true)
        toast.success('Reward claimed! $5 USDT added to your wallet')
      } else {
        toast.error('Failed to claim reward')
      }
    } catch (error) {
      toast.error('Network error')
    }
  }

  return (
    <div className="p-6">
      <h2 className="text-xl font-semibold mb-6">Tasks & Rewards</h2>

      {/* Main Task */}
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
            {taskCompleted ? (
              <CheckCircle className="w-8 h-8 text-green-500" />
            ) : (
              <XCircle className="w-8 h-8 text-red-500" />
            )}
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex justify-between items-center text-sm">
            <span className="text-gray-400">Task Status:</span>
            <span className={taskCompleted ? 'text-green-400' : 'text-red-400'}>
              {taskCompleted ? 'Completed' : 'Incomplete'}
            </span>
          </div>
          
          <div className="flex justify-between items-center text-sm">
            <span className="text-gray-400">Reward Status:</span>
            <span className={rewardClaimed ? 'text-green-400' : 'text-yellow-400'}>
              {rewardClaimed ? 'Claimed' : 'Available'}
            </span>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-crypto-border">
          {!taskCompleted ? (
            <button
              onClick={() => {
                setTaskCompleted(true)
                toast.success('Task completed! You can now claim your reward')
              }}
              className="w-full btn-primary"
            >
              Mark as Complete
            </button>
          ) : !rewardClaimed ? (
            <button
              onClick={handleClaimReward}
              className="w-full btn-primary flex items-center justify-center gap-2"
            >
              <DollarSign className="w-4 h-4" />
              Claim $5 USDT Reward
            </button>
          ) : (
            <div className="text-center py-2 text-green-400">
              <CheckCircle className="w-6 h-6 mx-auto mb-2" />
              <span className="text-sm">Reward claimed successfully!</span>
            </div>
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