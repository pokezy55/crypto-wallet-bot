import { useState } from 'react';

export interface SendResponse {
  txHash?: string;
  error?: string;
  detail?: string;
}

interface SendTokenParams {
  from: string;
  to: string;
  amount: string;
  token: string;
  chain: string;
  seed: string;
}

export function useSendToken() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);

  const sendToken = async (params: SendTokenParams) => {
    setLoading(true);
    setError(null);
    setTxHash(null);
    try {
      const res = await fetch('/api/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      });
      const data: SendResponse = await res.json();
      if (data.txHash) {
        setTxHash(data.txHash);
      } else {
        setError(data.error || data.detail || 'Failed to send transaction');
      }
    } catch (e: any) {
      setError(e.message || 'Failed to send transaction');
    } finally {
      setLoading(false);
    }
  };

  return { sendToken, loading, error, txHash };
} 