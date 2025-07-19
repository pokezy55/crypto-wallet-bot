import { useState } from 'react';
import { Copy } from 'lucide-react';
import QRCode from 'qrcode.react';
import { BaseModal } from './BaseModal';
import { isValidAddress } from '@/lib/address';
import toast from 'react-hot-toast';

interface ReceiveModalProps {
  isOpen: boolean;
  onClose: () => void;
  wallet?: {
    address: string;
  };
  selectedToken?: {
    symbol: string;
    name: string;
    logo?: string;
  };
}

export default function ReceiveModal({ isOpen, onClose, wallet, selectedToken }: ReceiveModalProps) {
  // Early validation of required props
  if (!isOpen || !wallet?.address || !isValidAddress(wallet.address)) {
    return null;
  }

  const copyAddress = () => {
    navigator.clipboard.writeText(wallet.address);
    toast.success('Address copied to clipboard!');
  };

  return (
    <BaseModal isOpen={isOpen} onClose={onClose} title="Receive">
      <div className="space-y-6 text-center">
        {/* QR Code */}
        <div className="bg-white p-4 rounded-lg inline-block mx-auto">
          <QRCode
            value={wallet.address}
            size={200}
            level="H"
            includeMargin={true}
            renderAs="svg"
          />
        </div>

        {/* Selected Token Info */}
        {selectedToken && (
          <div className="flex items-center justify-center gap-2">
            {selectedToken.logo && (
              <img
                src={selectedToken.logo}
                alt={selectedToken.symbol}
                className="w-6 h-6 rounded-full"
              />
            )}
            <span className="font-medium">{selectedToken.name} ({selectedToken.symbol})</span>
          </div>
        )}

        {/* Wallet Address */}
        <div className="space-y-2">
          <p className="text-sm text-gray-400">Your {selectedToken ? selectedToken.symbol : ''} Address</p>
          <div className="flex items-center justify-between bg-crypto-dark p-3 rounded-lg">
            <code className="text-sm break-all">{wallet.address}</code>
            <button
              onClick={copyAddress}
              className="ml-2 p-2 hover:bg-crypto-card rounded-lg transition-colors"
            >
              <Copy className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Network Warning */}
        <p className="text-sm text-yellow-500">
          Only send {selectedToken ? selectedToken.symbol : 'tokens'} to this address on the correct network.
          Sending tokens from other networks may result in permanent loss.
        </p>
      </div>
    </BaseModal>
  );
} 