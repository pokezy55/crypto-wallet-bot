import { getProvider, getTokenList } from '../../../lib/chain';
import { ethers } from 'ethers';

const ERC20_ABI = [
  'function balanceOf(address) view returns (uint256)',
  'function decimals() view returns (uint8)'
];

export default async function handler(req, res) {
  const { address, chain } = req.query;
  if (!address || !chain) {
    return res.status(400).json({ error: 'Missing address or chain' });
  }
  if (!ethers.utils.isAddress(address)) {
    return res.status(400).json({ error: 'Invalid address' });
  }
  let provider, tokens;
  try {
    provider = getProvider(chain);
    tokens = getTokenList(chain);
  } catch (e) {
    console.warn('Chain/provider error:', e.message);
    return res.status(400).json({ error: e.message });
  }
  const balances = {};
  try {
    for (const token of tokens) {
      if (token.isNative) {
        const bal = await provider.getBalance(address);
        balances[token.symbol] = ethers.utils.formatEther(bal);
      } else {
        const contract = new ethers.Contract(token.address, ERC20_ABI, provider);
        const bal = await contract.balanceOf(address);
        balances[token.symbol] = ethers.utils.formatUnits(bal, token.decimals);
      }
    }
    return res.json({ balances, chain });
  } catch (e) {
    console.warn('Balance fetch error:', e.message);
    return res.status(500).json({ error: 'Failed to fetch balances', detail: e.message });
  }
} 