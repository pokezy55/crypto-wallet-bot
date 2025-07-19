import { useState } from 'react';
import { BaseModal } from './ActionModal';
import { X, Copy } from 'lucide-react';
import QRCode from 'qrcode.react';
import toast from 'react-hot-toast';

interface ReceiveModalProps {
  isOpen: boolean;
  onClose: () => void;
  address: string;
}

export default function ReceiveModal({ isOpen, onClose, address }: ReceiveModalProps) {
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(address);
      toast.success('Address copied to clipboard!');
    } catch (error) {
      toast.error('Failed to copy address');
    }
  };

  if (!isOpen) return null;

  return (
    <BaseModal isOpen={isOpen} onClose={onClose} title="Receive">
      <div className="space-y-6">
        <div className="flex flex-col items-center">
          <div className="bg-white p-4 rounded-lg mb-4">
            <QRCode value={address} size={200} />
          </div>
          <div className="flex items-center gap-2">
            <code className="font-mono text-sm bg-crypto-card p-2 rounded">
              {address}
            </code>
            <button
              onClick={handleCopy}
              className="p-2 hover:bg-crypto-border rounded"
            >
              <Copy className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </BaseModal>
  );
} 