'use client'

import React from 'react';

interface User {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
}

interface TaskTabProps {
  user: User | null;
}

export default function TaskTab({ user }: TaskTabProps) {
  return (
    <div className="p-4">
      <h2 className="text-xl font-semibold mb-4">Tasks</h2>
      <div className="space-y-4">
        <div className="bg-crypto-card border border-crypto-border rounded-lg p-4">
          <h3 className="font-medium mb-2">Daily Tasks</h3>
          <p className="text-sm text-gray-400">Complete daily tasks to earn rewards.</p>
        </div>
        <div className="bg-crypto-card border border-crypto-border rounded-lg p-4">
          <h3 className="font-medium mb-2">Weekly Tasks</h3>
          <p className="text-sm text-gray-400">Complete weekly tasks to earn bonus rewards.</p>
        </div>
      </div>
    </div>
  );
} 