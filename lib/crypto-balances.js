import { JsonRpcProvider, Contract, formatUnits } from 'ethers';
import { CHAINS } from './chain';
import { ethers } from 'ethers';

const ERC20_ABI = ["function balanceOf(address) view returns (uint256)", "function decimals() view returns (uint8)"];

export async function fetchBalances(walletAddress, chainKey) {
  const chain = CHAINS[chainKey];
  if (!chain) throw new Error('Invalid chain');
  if (!chain.rpcUrl) throw new Error(`rpcUrl for chain '${chainKey}' is not set!`);
  const provider = new JsonRpcProvider(chain.rpcUrl);
  const balances = {};
  for (const token of chain.tokens) {
    if (!token.address) {
      // Native token
      try {
        const balance = await provider.getBalance(walletAddress);
        balances[token.symbol] = ethers.formatUnits(balance, token.decimals);
      } catch (err) {
        console.warn(`Error fetching ${token.symbol} native balance:`, err);
        balances[token.symbol] = '0';
      }
      continue;
    }
    try {
      // Always use EIP-55 checksum address
      const checksumAddress = ethers.getAddress(token.address);
      const contract = new ethers.Contract(checksumAddress, ERC20_ABI, provider);
      const balance = await contract.balanceOf(walletAddress);
      balances[token.symbol] = ethers.formatUnits(balance, token.decimals);
    } catch (err) {
      console.warn(`Error fetching ${token.symbol} balance:`, err);
      balances[token.symbol] = '0';
    }
  }
  return balances;
} 