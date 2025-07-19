import { ReactNode } from 'react';
import { ArrowLeftRight } from 'lucide-react';
import { ModalErrorBoundary } from './ModalErrorBoundary';

interface BaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}

export function BaseModal({ isOpen, onClose, title, children }: BaseModalProps) {
  // Early return if modal should be closed
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-crypto-card border border-crypto-border rounded-xl p-6 w-full max-w-sm mx-4">
        <div className="flex items-center mb-6">
          <button
            onClick={onClose}
            className="mr-4 p-2 rounded-lg bg-crypto-card border border-crypto-border"
          >
            <ArrowLeftRight className="w-5 h-5" />
          </button>
          <h2 className="text-xl font-semibold">{title}</h2>
        </div>

        <ModalErrorBoundary onReset={onClose}>
          {children}
        </ModalErrorBoundary>
      </div>
    </div>
  );
} 