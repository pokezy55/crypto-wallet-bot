import { getProvider, getTokenList } from '../../../lib/chain';
import { ethers } from 'ethers';

const ERC20_ABI = [
  'function transfer(address to, uint256 amount) returns (bool)'
];

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  const { from, to, amount, token, chain, seed } = req.body;
  if (!from || !to || !amount || !token || !chain || !seed) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  if (!ethers.utils.isAddress(from) || !ethers.utils.isAddress(to)) {
    return res.status(400).json({ error: 'Invalid address' });
  }
  if (isNaN(amount) || Number(amount) <= 0) {
    return res.status(400).json({ error: 'Invalid amount' });
  }
  let provider, tokens;
  try {
    provider = getProvider(chain);
    tokens = getTokenList(chain);
  } catch (e) {
    console.warn('Chain/provider error:', e.message);
    return res.status(400).json({ error: e.message });
  }
  let wallet;
  try {
    wallet = ethers.Wallet.fromMnemonic(seed).connect(provider);
    if (wallet.address.toLowerCase() !== from.toLowerCase()) {
      return res.status(400).json({ error: 'Seed phrase does not match sender address' });
    }
  } catch (e) {
    console.warn('Wallet error:', e.message);
    return res.status(400).json({ error: 'Invalid seed phrase' });
  }
  try {
    const native = tokens.find(t => t.isNative && t.symbol === token);
    if (native) {
      // Native transfer
      const tx = await wallet.sendTransaction({ to, value: ethers.utils.parseEther(amount) });
      await tx.wait();
      return res.json({ txHash: tx.hash });
    } else {
      // ERC20 transfer
      const erc20 = tokens.find(t => !t.isNative && t.symbol === token);
      if (!erc20) {
        return res.status(400).json({ error: 'Token not found on this chain' });
      }
      const contract = new ethers.Contract(erc20.address, ERC20_ABI, wallet);
      const tx = await contract.transfer(to, ethers.utils.parseUnits(amount, erc20.decimals));
      await tx.wait();
      return res.json({ txHash: tx.hash });
    }
  } catch (e) {
    console.error('Send error:', e.message);
    return res.status(500).json({ error: 'Failed to send transaction', detail: e.message });
  }
} 