import { JsonRpcProvider, Contract, formatUnits } from 'ethers';
import { CHAINS } from './chain';

const ERC20_ABI = ["function balanceOf(address) view returns (uint256)", "function decimals() view returns (uint8)"];

export async function fetchBalances(walletAddress, chainKey) {
  const chain = CHAINS[chainKey];
  if (!chain) throw new Error('Invalid chain');
  if (!chain.rpcUrl) throw new Error(`rpcUrl for chain '${chainKey}' is not set!`);
  const provider = new JsonRpcProvider(chain.rpcUrl);
  const balances = {};
  for (const token of chain.tokens) {
    try {
      let raw;
      if (!token.address) {
        raw = await provider.getBalance(walletAddress);
        balances[token.symbol] = formatUnits(raw, token.decimals);
      } else {
        const contract = new Contract(token.address, ERC20_ABI, provider);
        raw = await contract.balanceOf(walletAddress);
        balances[token.symbol] = formatUnits(raw, token.decimals);
      }
    } catch (e) {
      console.warn(`Failed to fetch balance for ${token.symbol}:`, e);
      balances[token.symbol] = "0";
    }
  }
  return balances;
} 