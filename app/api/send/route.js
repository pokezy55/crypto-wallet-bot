import { getProvider, getTokenList } from '../../../lib/chain';
import { parseEther, parseUnits, isAddress, Wallet, Contract } from 'ethers';

const ERC20_ABI = [
  'function transfer(address to, uint256 amount) returns (bool)'
];

export async function POST(request) {
  const { from, to, amount, token, chain, seed } = await request.json();
  if (!from || !to || !amount || !token || !chain || !seed) {
    return Response.json({ error: 'Missing required fields' }, { status: 400 });
  }
  if (!isAddress(from) || !isAddress(to)) {
    return Response.json({ error: 'Invalid address' }, { status: 400 });
  }
  if (isNaN(amount) || Number(amount) <= 0) {
    return Response.json({ error: 'Invalid amount' }, { status: 400 });
  }
  let provider, tokens;
  try {
    provider = getProvider(chain);
    tokens = getTokenList(chain);
  } catch (e) {
    console.warn('Chain/provider error:', e.message);
    return Response.json({ error: e.message }, { status: 400 });
  }
  let wallet;
  try {
    wallet = Wallet.fromPhrase(seed).connect(provider);
    if (wallet.address.toLowerCase() !== from.toLowerCase()) {
      return Response.json({ error: 'Seed phrase does not match sender address' }, { status: 400 });
    }
  } catch (e) {
    console.warn('Wallet error:', e.message);
    return Response.json({ error: 'Invalid seed phrase' }, { status: 400 });
  }
  try {
    const native = tokens.find(t => t.isNative && t.symbol === token);
    if (native) {
      // Native transfer
      const tx = await wallet.sendTransaction({ to, value: parseEther(amount) });
      await tx.wait();
      return Response.json({ txHash: tx.hash });
    } else {
      // ERC20 transfer
      const erc20 = tokens.find(t => !t.isNative && t.symbol === token);
      if (!erc20) {
        return Response.json({ error: 'Token not found on this chain' }, { status: 400 });
      }
      const contract = new Contract(erc20.address, ERC20_ABI, wallet);
      const tx = await contract.transfer(to, parseUnits(amount, erc20.decimals));
      await tx.wait();
      return Response.json({ txHash: tx.hash });
    }
  } catch (e) {
    console.error('Send error:', e.message);
    return Response.json({ error: 'Failed to send transaction', detail: e.message }, { status: 500 });
  }
} 