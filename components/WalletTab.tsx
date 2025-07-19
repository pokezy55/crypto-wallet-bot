'use client'

import { useState, useEffect, useMemo } from 'react';
import { Send, Download, ArrowLeftRight, Copy, QrCode, Plus, Settings, RefreshCw } from 'lucide-react';
import { formatAddress, isValidAddress } from '@/lib/address';
import { useBalance } from '../hooks/useBalance';
import { useSendToken } from '../hooks/useSendToken';
import { useTokenPrices } from '../hooks/useTokenPrices';
import TokenRow from './TokenRow';
import { CHAINS, shouldMergeToken } from '../lib/chain';
import toast from 'react-hot-toast';

interface SendFormState {
  address: string;
  amount: string;
  token: string;
}

interface WalletTabProps {
  wallet: {
    address: string;
    seedPhrase?: string;
  };
}

export default function WalletTab({ wallet }: WalletTabProps) {
  // Basic states
  const [activeSection, setActiveSection] = useState<'main' | 'send' | 'receive'>('main');
  const [chain, setChain] = useState('eth');
  const [showConfirm, setShowConfirm] = useState(false);
  const [txStatus, setTxStatus] = useState<'idle' | 'pending' | 'success' | 'error'>('idle');
  const [txError, setTxError] = useState('');
  
  // Form state
  const [sendForm, setSendForm] = useState<SendFormState>({
    address: '',
    amount: '',
    token: 'ETH'
  });

  // Hooks
  const { balances: tokenBalances, loading: loadingBalance, error: hookBalanceError, refetch } = useBalance(chain, wallet?.address);
  const tokenPrices = useTokenPrices();

  // Auto refresh balances
  useEffect(() => {
    refetch();
    const interval = setInterval(refetch, 60000);
    return () => clearInterval(interval);
  }, [refetch]);

  // Process token list
  const tokenList = useMemo(() => {
    const chains: Record<string, any> = CHAINS;
    const tokens = (chains[chain]?.tokens || []).map((def: any) => {
      const bal = tokenBalances.find(b => b.symbol.toLowerCase() === def.symbol.toLowerCase())?.balance || '0';
      const price = tokenPrices[def.symbol] || { priceUSD: 0, priceChange24h: 0 };
      return {
        ...def,
        balance: parseFloat(bal),
        priceUSD: price.priceUSD,
        priceChange24h: price.priceChange24h,
        chains: [chain.toUpperCase()],
        name: def.name || def.symbol,
        logo: def.logo || '',
        isMerged: false,
        isNative: def.isNative || false
      };
    });

    return tokens.sort((a, b) => {
      if (a.isNative && !b.isNative) return -1;
      if (!a.isNative && b.isNative) return 1;
      const aValue = a.balance * (a.priceUSD || 0);
      const bValue = b.balance * (b.priceUSD || 0);
      return bValue - aValue;
    });
  }, [chain, tokenBalances, tokenPrices]);

  // Calculate total value
  const totalValue = useMemo(() => {
    return tokenList.reduce((total, token) => {
      if (!token.balance || token.balance <= 0) return total;
      return total + (token.balance * (token.priceUSD || 0));
    }, 0);
  }, [tokenList]);

  // Handlers
  const handleCopyAddress = () => {
    if (wallet?.address) {
      navigator.clipboard.writeText(wallet.address);
      toast.success('Address copied!');
    }
  };

  const handleSendClick = () => {
    if (!wallet?.address) {
      toast.error('Please connect wallet first');
      return;
    }
    setActiveSection('send');
  };

  const handleSendConfirm = async () => {
    const token = tokenList.find(t => t.symbol === sendForm.token);
    if (!wallet?.seedPhrase || !token || !isValidAddress(sendForm.address)) return;

    setTxStatus('pending');
    setTxError('');
    
    try {
      const response = await fetch('/api/transaction/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from: wallet.address,
          to: sendForm.address,
          token: token.symbol,
          chain,
          amount: sendForm.amount,
          seedPhrase: wallet.seedPhrase
        })
      });

      const result = await response.json();
      
      if (response.ok && result.success) {
        setTxStatus('success');
        await refetch();
      } else {
        setTxStatus('error');
        setTxError(result.error || 'Failed to send transaction');
      }
    } catch (error) {
      console.error('Send transaction error:', error);
      setTxStatus('error');
      setTxError('Failed to send transaction');
    }
  };

  const handleMax = (token: any) => {
    if (!token) return;
    const estimatedFee = token.isNative ? 0.001 : 0;
    const maxAmount = token.isNative 
      ? Math.max(0, token.balance - estimatedFee)
      : token.balance;
    setSendForm(prev => ({ ...prev, amount: maxAmount.toFixed(6) }));
  };

  // Render Send Section
  if (activeSection === 'send') {
    const sendableTokens = tokenList.filter(t => t.balance > 0);
    const selectedToken = sendableTokens.find(t => t.symbol === sendForm.token);
    const isAddressValid = isValidAddress(sendForm.address);
    const isFormValid = isAddressValid && 
      sendForm.amount && 
      parseFloat(sendForm.amount) > 0 && 
      selectedToken;

    return (
      <div className="p-6">
        <div className="flex items-center mb-6">
          <button
            onClick={() => {
              setActiveSection('main');
              setSendForm({ address: '', amount: '', token: 'ETH' });
              setTxStatus('idle');
              setTxError('');
            }}
            className="mr-4 p-2 rounded-lg bg-crypto-card border border-crypto-border"
          >
            <ArrowLeftRight className="w-5 h-5" />
          </button>
          <h2 className="text-xl font-semibold">Send</h2>
        </div>

        <div className="card">
          <div className="space-y-4">
            {/* Token Selector */}
            <div>
              <label className="block text-sm font-medium mb-2">Token</label>
              <div className="relative">
                <select
                  value={sendForm.token}
                  onChange={e => setSendForm(prev => ({ ...prev, token: e.target.value }))}
                  className="input-field w-full pl-12"
                >
                  {sendableTokens.map(token => (
                    <option key={token.symbol} value={token.symbol}>
                      {token.name} ({token.balance.toFixed(4)} {token.symbol})
                    </option>
                  ))}
                </select>
                {selectedToken && (
                  <img 
                    src={selectedToken.logo} 
                    alt={selectedToken.symbol}
                    className="absolute left-2 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full"
                  />
                )}
              </div>
            </div>

            {/* Recipient Address */}
            <div>
              <label className="block text-sm font-medium mb-2">Recipient Address</label>
              <input
                type="text"
                value={sendForm.address}
                onChange={e => setSendForm(prev => ({ ...prev, address: e.target.value }))}
                placeholder="0x..."
                className="input-field w-full"
              />
              {!isAddressValid && sendForm.address && (
                <p className="text-red-500 text-xs mt-1">Invalid address</p>
              )}
            </div>

            {/* Amount */}
            <div>
              <label className="block text-sm font-medium mb-2">Amount</label>
              <div className="flex gap-2">
                <input
                  type="number"
                  value={sendForm.amount}
                  onChange={e => setSendForm(prev => ({ ...prev, amount: e.target.value }))}
                  placeholder="0.0"
                  className="input-field flex-1"
                  min="0"
                  step="any"
                />
                <button
                  onClick={() => handleMax(selectedToken)}
                  className="btn-secondary px-3"
                >
                  MAX
                </button>
              </div>
              {selectedToken && (
                <p className="text-xs text-gray-400 mt-1">
                  Available: {selectedToken.balance.toFixed(6)} {selectedToken.symbol}
                </p>
              )}
            </div>

            {/* Network Fee */}
            {selectedToken?.isNative && (
              <p className="text-xs text-gray-400">
                Estimated Network Fee: 0.001 {selectedToken.symbol}
              </p>
            )}

            {/* Send Button */}
            <button
              onClick={() => setShowConfirm(true)}
              disabled={!isFormValid}
              className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Send {selectedToken?.symbol || 'Token'}
            </button>
          </div>
        </div>

        {/* Confirmation Modal */}
        {showConfirm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-crypto-card border border-crypto-border rounded-xl p-6 w-full max-w-sm mx-4">
              <h3 className="text-lg font-semibold mb-4">Confirm Transaction</h3>
              
              <div className="space-y-2 mb-4">
                <p>Send <b>{sendForm.amount} {selectedToken?.symbol}</b></p>
                <p className="text-sm text-gray-400">to</p>
                <p className="font-mono text-primary-500 break-all">{sendForm.address}</p>
                {selectedToken?.isNative && (
                  <p className="text-sm text-gray-400">
                    Network Fee: 0.001 {selectedToken.symbol}
                  </p>
                )}
              </div>

              {txStatus === 'idle' && (
                <div className="flex gap-2">
                  <button 
                    onClick={() => setShowConfirm(false)} 
                    className="btn-secondary flex-1"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={handleSendConfirm}
                    className="btn-primary flex-1"
                  >
                    Confirm
                  </button>
                </div>
              )}

              {txStatus === 'pending' && (
                <div className="text-center py-4">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500 mx-auto mb-2"></div>
                  <p>Processing transaction...</p>
                </div>
              )}

              {txStatus === 'success' && (
                <div className="text-center">
                  <p className="text-green-500 mb-4">Transaction sent successfully!</p>
                  <button
                    onClick={() => {
                      setShowConfirm(false);
                      setActiveSection('main');
                      setSendForm({ address: '', amount: '', token: 'ETH' });
                      setTxStatus('idle');
                    }}
                    className="btn-primary w-full"
                  >
                    Done
                  </button>
                </div>
              )}

              {txStatus === 'error' && (
                <div className="text-center">
                  <p className="text-red-500 mb-4">{txError}</p>
                  <button
                    onClick={() => {
                      setTxStatus('idle');
                      setTxError('');
                    }}
                    className="btn-primary w-full"
                  >
                    Try Again
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }

  // Render Main Section
  return (
    <div className="p-4">
      {/* Address & Chain Selector */}
      <div className="flex items-center justify-between mb-2">
        <span className="font-mono text-xs text-gray-400">
          {formatAddress(wallet.address)}
        </span>
        <div className="flex items-center gap-2">
          <button 
            onClick={refetch}
            disabled={loadingBalance}
            className="p-1 bg-gray-700 rounded hover:bg-primary-700 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 text-white ${loadingBalance ? 'animate-spin' : ''}`} />
          </button>
          <button 
            onClick={handleCopyAddress} 
            className="p-1 bg-gray-700 rounded hover:bg-primary-700"
          >
            <Copy className="w-4 h-4 text-white" />
          </button>
          {/* Chain Selector */}
          <select
            value={chain}
            onChange={e => setChain(e.target.value)}
            className="bg-crypto-card border border-crypto-border rounded-lg px-3 py-2"
          >
            <option value="eth">Ethereum</option>
            <option value="bsc">BSC</option>
            <option value="polygon">Polygon</option>
            <option value="base">Base</option>
          </select>
        </div>
      </div>

      {/* Total Value */}
      <div className="text-center mb-4">
        <div className="text-3xl font-bold text-white">
          ${totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </div>
        <div className="text-xs text-gray-400">Total Portfolio Value</div>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-between mb-6">
        <button 
          onClick={handleSendClick}
          className="flex flex-col items-center text-gray-400 hover:text-white"
        >
          <Send className="w-6 h-6 mb-1" />
          <span className="text-xs">Send</span>
        </button>
        <button 
          onClick={() => setActiveSection('receive')}
          className="flex flex-col items-center text-gray-400 hover:text-white"
        >
          <Download className="w-6 h-6 mb-1" />
          <span className="text-xs">Receive</span>
        </button>
        <button 
          className="flex flex-col items-center text-gray-400 hover:text-white"
        >
          <Plus className="w-6 h-6 mb-1" />
          <span className="text-xs">Add</span>
        </button>
      </div>

      {/* Token List */}
      <div className="space-y-2">
        {tokenList.map((token) => (
          <TokenRow
            key={`${token.symbol}-${token.chains[0]}`}
            symbol={token.symbol}
            name={token.name}
            logo={token.logo}
            balance={token.balance}
            priceUSD={token.priceUSD}
            priceChange24h={token.priceChange24h}
            chains={token.chains}
            isMerged={token.isMerged}
          />
        ))}
      </div>
    </div>
  );
} 