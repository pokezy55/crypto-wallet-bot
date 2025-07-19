import { NextResponse } from 'next/server';
import { getUserTasks, checkAndRewardReferral } from '@/lib/database';

// Prevent prerendering
export const dynamic = 'force-dynamic';

export async function GET(req, { params }) {
  try {
    const { userId } = params;
    const tasks = await getUserTasks(userId);
    
    // Check if tasks are completed and reward referrer if needed
    checkAndRewardReferral(userId).then(reward => {
      if (reward) {
        console.log(`Referral reward created for user ${reward.user_id}, amount: ${reward.amount} ${reward.token}`);
      }
    }).catch(error => {
      console.error('Error checking referral reward:', error);
    });
    
    return NextResponse.json(tasks);
  } catch (error) {
    console.error('Error fetching tasks:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tasks' },
      { status: 500 }
    );
  }
} 