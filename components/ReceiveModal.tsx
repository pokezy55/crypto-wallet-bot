import { BaseModal } from './BaseModal';
import QRCode from 'qrcode.react';
import { Copy } from 'lucide-react';
import toast from 'react-hot-toast';

interface ReceiveModalProps {
  isOpen: boolean;
  onClose: () => void;
  address: string;
}

export function ReceiveModal({ isOpen, onClose, address }: ReceiveModalProps) {
  const handleCopy = () => {
    navigator.clipboard.writeText(address);
    toast.success('Address copied to clipboard');
  };

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title="Receive"
    >
      <div className="space-y-4">
        <div className="flex justify-center">
          <QRCode value={address} size={200} />
        </div>

        <div className="text-center">
          <p className="text-sm text-gray-400 mb-2">Your wallet address</p>
          <div className="flex items-center justify-center gap-2">
            <code className="text-sm bg-crypto-dark p-2 rounded break-all">
              {address}
            </code>
            <button
              onClick={handleCopy}
              className="p-2 rounded hover:bg-crypto-hover"
            >
              <Copy className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </BaseModal>
  );
} 