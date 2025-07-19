'use client'

import { useState, useEffect } from 'react';
import WalletTab from '@/components/WalletTab';
import { Toaster } from 'react-hot-toast';

export default function Home() {
  const [wallet, setWallet] = useState<any>(null);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    // Mock data for testing
    setWallet({
      address: '0x1183...6791',
      seedPhrase: 'test test test test test test test test test test test test',
      privateKey: '0x1234567890'
    });
    setUser({
      id: 1,
      first_name: 'Test',
      username: 'test'
    });
  }, []);

  return (
    <>
      <div className="flex-1 flex flex-col bg-crypto-dark">
        <WalletTab
          wallet={wallet}
          user={user}
          onWalletUpdate={setWallet}
        />
      </div>
      <Toaster
        position="top-center"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#1e293b',
            color: '#ffffff',
            border: '1px solid #334155',
          },
        }}
      />
    </>
  );
} 