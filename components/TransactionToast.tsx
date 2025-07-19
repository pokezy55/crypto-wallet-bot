interface TransactionToastProps {
  txHash: string;
}

export function TransactionToast({ txHash }: TransactionToastProps) {
  return (
    <div className="space-y-1">
      <p>Transaction sent!</p>
      <p className="text-xs break-all">
        TxHash: {txHash}
      </p>
    </div>
  );
} 