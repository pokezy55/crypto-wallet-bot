// Format EVM address pendek: 0x1234...abcd
export function formatAddress(address) {
  if (!address || address.length !== 42 || !address.startsWith('0x')) return address;
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

// Validasi address EVM (Ethereum, BSC, dsb.)
export function isValidAddress(address) {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
} 