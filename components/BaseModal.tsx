import { ReactNode } from 'react';
import { ArrowLeftRight } from 'lucide-react';
import { ModalErrorBoundary } from './ModalErrorBoundary';

export interface BaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  onAction?: () => void | Promise<void>;
  isLoading?: boolean;
  error?: string;
}

export function BaseModal({ 
  isOpen, 
  onClose, 
  title, 
  children,
  onAction,
  isLoading = false,
  error
}: BaseModalProps) {
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
          
          {error && (
            <div className="mt-4 text-red-500 text-sm">
              {error}
            </div>
          )}

          {onAction && (
            <button
              onClick={onAction}
              disabled={isLoading}
              className="mt-6 w-full py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Processing...</span>
                </div>
              ) : (
                'Send'
              )}
            </button>
          )}
        </ModalErrorBoundary>
      </div>
    </div>
  );
} 