import { Component, ReactNode } from 'react';
import { ArrowLeftRight } from 'lucide-react';

// Error Boundary
interface ErrorBoundaryProps {
  children: ReactNode;
  onReset?: () => void;
  fallback?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ModalErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }
      return (
        <div className="text-center py-4">
          <p className="text-red-500 mb-2">Something went wrong</p>
          <button
            onClick={() => {
              this.setState({ hasError: false, error: null });
              if (this.props.onReset) this.props.onReset();
            }}
            className="btn-primary px-4 py-2"
          >
            Try Again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

// Base Modal Props
export interface BaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}

// Base Modal Component
export function BaseModal({ isOpen, onClose, title, children }: BaseModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-crypto-card border border-crypto-border rounded-xl p-6 w-full max-w-sm mx-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="p-2 rounded-lg bg-crypto-card border border-crypto-border"
            >
              <ArrowLeftRight className="w-5 h-5" />
            </button>
            <h3 className="text-lg font-semibold">{title}</h3>
          </div>
        </div>
        <ModalErrorBoundary onReset={onClose}>
          {children}
        </ModalErrorBoundary>
      </div>
    </div>
  );
}

// Token Type
export interface Token {
  symbol: string;
  name: string;
  logo?: string;
  balance: number;
  priceUSD: number;
  priceChange24h: number;
  isNative: boolean;
  chains: string[];
}

// Common Props for Action Modals
export interface ActionModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedToken?: Token;
  chain: string;
  wallet: {
    address: string;
    seedPhrase?: string;
  };
}

// Status Type
export type TxStatus = 'idle' | 'pending' | 'success' | 'error';

// Helper Components
export function LoadingSpinner() {
  return (
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500" />
  );
}

export function ErrorMessage({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="text-center">
      <p className="text-red-500 mb-4">{message}</p>
      <button onClick={onRetry} className="btn-primary">
        Try Again
      </button>
    </div>
  );
}

export function SuccessMessage({ message, onClose }: { message: string; onClose: () => void }) {
  return (
    <div className="text-center">
      <p className="text-green-500 mb-4">{message}</p>
      <button onClick={onClose} className="btn-primary">
        Done
      </button>
    </div>
  );
} 