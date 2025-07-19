'use client'

import React from 'react';

interface User {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
}

interface ReferralTabProps {
  user: User | null;
}

export default function ReferralTab({ user }: ReferralTabProps) {
  return (
    <div className="p-4">
      <h2 className="text-xl font-semibold mb-4">Referral Program</h2>
      <div className="space-y-4">
        <div className="bg-crypto-card border border-crypto-border rounded-lg p-4">
          <h3 className="font-medium mb-2">Your Referral Link</h3>
          <p className="text-sm text-gray-400">Share your link to earn rewards when friends join.</p>
        </div>
        <div className="bg-crypto-card border border-crypto-border rounded-lg p-4">
          <h3 className="font-medium mb-2">Referral Stats</h3>
          <p className="text-sm text-gray-400">Track your referral earnings and performance.</p>
        </div>
      </div>
    </div>
  );
} 