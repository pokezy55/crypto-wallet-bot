import { getProvider, getTokenList } from '../../../lib/chain';
import { formatEther, formatUnits, isAddress, Contract } from 'ethers';

const ERC20_ABI = [
  'function balanceOf(address) view returns (uint256)'
];

export async function POST(request) {
  const { address, chain } = await request.json();
  if (!address || !chain) {
    return Response.json({ error: 'Missing address or chain' }, { status: 400 });
  }
  if (!isAddress(address)) {
    return Response.json({ error: 'Invalid address' }, { status: 400 });
  }
  let provider, tokens;
  try {
    provider = getProvider(chain);
    tokens = getTokenList(chain);
  } catch (e) {
    console.warn('Chain/provider error:', e.message);
    return Response.json({ error: e.message }, { status: 400 });
  }
  const balances = [];
  try {
    let nativeBalance = null;
    let erc20Balances = [];
    for (const token of tokens) {
      let bal;
      if (token.isNative) {
        bal = await provider.getBalance(address);
        bal = formatEther(bal);
        nativeBalance = bal;
      } else {
        const contract = new Contract(token.address, ERC20_ABI, provider);
        bal = await contract.balanceOf(address);
        bal = formatUnits(bal, token.decimals);
        erc20Balances.push({ symbol: token.symbol, balance: bal });
      }
      balances.push({
        symbol: token.symbol,
        balance: bal,
        address: token.address,
        chainId: provider.network?.chainId || null,
        isNative: token.isNative,
        decimals: token.decimals,
      });
    }
    if (chain === 'bsc') {
      console.log('BSC balance check', address, nativeBalance, erc20Balances);
    }
    console.log('Fetched balances', balances);
    return Response.json({ balances, chain });
  } catch (e) {
    console.warn('Balance fetch error:', e.message, e);
    return Response.json({ error: 'Failed to fetch balances', detail: e.message }, { status: 500 });
  }
} 