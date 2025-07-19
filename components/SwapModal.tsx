import { useState } from 'react';
import { BaseModal } from './BaseModal';

interface SwapModalProps {
  isOpen: boolean;
  onClose: () => void;
  chain: string;
  seedPhrase?: string;
  privateKey?: string;
}

export function SwapModal({ isOpen, onClose, chain, seedPhrase, privateKey }: SwapModalProps) {
  const [form, setForm] = useState({ fromToken: '', toToken: '', amount: '' });

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title="Swap"
    >
      <div className="space-y-4">
        <div className="text-center text-gray-400">
          Swap feature coming soon!
        </div>
      </div>
    </BaseModal>
  );
} 