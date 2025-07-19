import { isAddress } from 'ethers';

/**
 * Validates Ethereum address format
 * @param address Address to validate
 * @returns {boolean} True if address is valid
 */
export function isValidEthereumAddress(address: string): boolean {
  if (!address) return false;
  
  // Check basic format (0x followed by 40 hex characters)
  if (!/^0x[0-9a-fA-F]{40}$/.test(address)) {
    return false;
  }

  // Use ethers.js validation
  try {
    return isAddress(address);
  } catch {
    return false;
  }
}

/**
 * Validates amount string format
 * @param amount Amount string to validate
 * @returns {boolean} True if amount format is valid
 */
export function isValidAmountFormat(amount: string): boolean {
  if (!amount) return false;

  // Remove any commas and spaces
  const cleanAmount = amount.replace(/,/g, '').trim();

  // Check if it's a valid decimal number with optional decimal point
  if (!/^\d*\.?\d*$/.test(cleanAmount)) {
    return false;
  }

  // Parse as number and check if it's positive
  const value = parseFloat(cleanAmount);
  return !isNaN(value) && value > 0;
}

/**
 * Formats amount string for blockchain transaction
 * @param amount Amount string to format
 * @param decimals Number of decimals for the token
 * @returns {string} Formatted amount string
 */
export function formatAmount(amount: string, decimals: number): string {
  if (!isValidAmountFormat(amount)) {
    throw new Error('Invalid amount format');
  }

  // Remove any commas and spaces
  let cleanAmount = amount.replace(/,/g, '').trim();

  // Handle leading zeros and decimal points
  if (cleanAmount.startsWith('.')) {
    cleanAmount = '0' + cleanAmount;
  }
  cleanAmount = cleanAmount.replace(/^0+(\d)/, '$1');

  // Split into integer and decimal parts
  const [integerPart, decimalPart = ''] = cleanAmount.split('.');

  // Ensure decimal places don't exceed token decimals
  if (decimalPart.length > decimals) {
    throw new Error(`Maximum ${decimals} decimal places allowed`);
  }

  // Pad with zeros if needed
  const paddedDecimal = decimalPart.padEnd(decimals, '0');

  return integerPart + paddedDecimal;
}

/**
 * Checks if a string might be a private key or mnemonic
 * @param input String to check
 * @returns {boolean} True if input might be sensitive data
 */
export function isSensitiveData(input: string): boolean {
  if (!input) return false;

  // Check for possible mnemonic (12-24 words)
  const wordCount = input.trim().split(/\s+/).length;
  if (wordCount >= 12 && wordCount <= 24) {
    return true;
  }

  // Check for possible private key (64 hex characters)
  if (/^[0-9a-fA-F]{64}$/.test(input)) {
    return true;
  }

  return false;
} 